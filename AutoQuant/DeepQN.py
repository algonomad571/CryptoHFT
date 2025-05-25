import os
import json
import random
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
import gym
from gym import spaces
from collections import deque
import matplotlib.pyplot as plt
import ta

# === Data Preparation ===
def load_data(path):
    df = pd.read_csv(path, parse_dates=["timestamp"], index_col="timestamp")
    df = df.sort_index()
    df = df[df['volume'] > 0].dropna()

    df['MA_20'] = ta.trend.sma_indicator(df['close'], window=20)
    df['EMA_20'] = ta.trend.ema_indicator(df['close'], window=20)
    df['RSI'] = ta.momentum.rsi(df['close'], window=14)
    df['MACD'] = ta.trend.macd_diff(df['close'])
    df['BB_bbm'] = ta.volatility.bollinger_mavg(df['close'])
    df['BB_bbh'] = ta.volatility.bollinger_hband(df['close'])
    df['BB_bbl'] = ta.volatility.bollinger_lband(df['close'])
    df['ATR'] = ta.volatility.average_true_range(df['high'], df['low'], df['close'])
    df['OBV'] = ta.volume.on_balance_volume(df['close'], df['volume'])
    df['STOCH'] = ta.momentum.stoch(df['high'], df['low'], df['close'])

    df = df.dropna().copy()
    return (df - df.mean()) / df.std()  # Normalize

# === Trading Environment ===
class CryptoTradingEnv(gym.Env):
    def __init__(self, df, window_size=60, initial_balance=1000):
        self.df = df
        self.window_size = window_size
        self.initial_balance = initial_balance
        self.action_space = spaces.Discrete(3)
        self.observation_space = spaces.Box(low=-np.inf, high=np.inf, shape=(window_size * df.shape[1],), dtype=np.float32)

    def reset(self):
        self.balance = self.initial_balance
        self.position = 0
        self.entry_price = 0
        self.total_profit = 0
        self.current_step = self.window_size
        return self._get_observation()

    def _get_observation(self):
        return self.df.iloc[self.current_step - self.window_size:self.current_step].values.flatten()

    def step(self, action):
        current_price = self.df.iloc[self.current_step]['close']
        reward = 0

        if action == 1 and self.position == 0:
            self.position = self.balance / current_price
            self.entry_price = current_price
            self.balance = 0
        elif action == 2 and self.position > 0:
            self.balance = self.position * current_price
            reward = self.balance - self.initial_balance
            self.total_profit += reward
            self.position = 0
            self.entry_price = 0
        elif self.position > 0:
            reward = (current_price - self.entry_price) * self.position * 0.01  # soft reward

        self.current_step += 1
        done = self.current_step >= len(self.df) - 1
        return self._get_observation(), reward, done, {}

# === DQN Network ===
class DQN(nn.Module):
    def __init__(self, input_dim, output_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 256),
            nn.ReLU(),
            nn.Linear(256, 128),
            nn.ReLU(),
            nn.Linear(128, output_dim)
        )

    def forward(self, x):
        return self.net(x)

# === Agent ===
class Agent:
    def __init__(self, state_size, action_size, device="cpu"):
        self.device = device
        self.memory = deque(maxlen=10000)
        self.gamma = 0.95
        self.epsilon = 1.0
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.model = DQN(state_size, action_size).to(self.device)
        self.optimizer = optim.Adam(self.model.parameters(), lr=0.001)
        self.loss_fn = nn.MSELoss()

    def act(self, state, exploit=False):
        if not exploit and np.random.rand() <= self.epsilon:
            return random.randrange(3)
        state_tensor = torch.FloatTensor(state).unsqueeze(0).to(self.device)
        with torch.no_grad():
            q_values = self.model(state_tensor)
        return torch.argmax(q_values).item()

    def remember(self, s, a, r, s_, done):
        self.memory.append((s, a, r, s_, done))

    def replay(self, batch_size):
        if len(self.memory) < batch_size:
            return
        minibatch = random.sample(self.memory, batch_size)
        states, targets = [], []

        for s, a, r, s_, done in minibatch:
            s = torch.FloatTensor(s).to(self.device)
            s_ = torch.FloatTensor(s_).to(self.device)
            target = self.model(s.unsqueeze(0)).detach().clone()
            target[0][a] = r if done else r + self.gamma * torch.max(self.model(s_.unsqueeze(0))).item()
            states.append(s)
            targets.append(target[0])

        states = torch.stack(states)
        targets = torch.stack(targets)

        self.optimizer.zero_grad()
        output = self.model(states)
        loss = self.loss_fn(output, targets)
        loss.backward()
        self.optimizer.step()

        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    def save(self, path):
        torch.save(self.model.state_dict(), path)

    def load(self, path):
        self.model.load_state_dict(torch.load(path, map_location=self.device))

# === Training ===
def train(agent, env, episodes=300, batch_size=32):
    for e in range(episodes):
        state = env.reset()
        done = False
        total_reward = 0
        while not done:
            action = agent.act(state)
            next_state, reward, done, _ = env.step(action)
            agent.remember(state, action, reward, next_state, done)
            agent.replay(batch_size)
            state = next_state
            total_reward += reward
        print(f"✅ Episode {e+1}/{episodes} | Total Reward: {total_reward:.2f}")
        agent.save("dqn_model.pth")

# === Evaluation & Plotting ===
def evaluate(agent, df, window_size=60):
    env = CryptoTradingEnv(df, window_size=window_size)
    state = env.reset()
    done = False
    balance_log, trade_profits = [], []

    while not done:
        action = agent.act(state, exploit=True)
        current_price = df.iloc[env.current_step]['close']
        balance_before = env.balance + env.position * current_price
        state, reward, done, _ = env.step(action)
        balance_after = env.balance + env.position * df.iloc[env.current_step]['close']
        balance_log.append(balance_after)
        if action == 2 and reward != 0:
            trade_profits.append(reward)

    drawdown = max([(max(balance_log[:i+1]) - b) / max(balance_log[:i+1]) * 100 for i, b in enumerate(balance_log)])
    win_rate = 100 * sum(1 for p in trade_profits if p > 0) / len(trade_profits) if trade_profits else 0

    print(f"💰 Final Balance: {balance_log[-1]:.2f}")
    print(f"📈 Total Profit: {balance_log[-1] - env.initial_balance:.2f}")
    print(f"📊 Win Rate: {win_rate:.2f}% | 📉 Max Drawdown: {drawdown:.2f}%")

    plt.figure(figsize=(14, 6))
    plt.plot(balance_log, label="Balance")
    plt.title("Account Balance Over Time")
    plt.xlabel("Steps")
    plt.ylabel("Balance ($)")
    plt.grid(True)
    plt.legend()
    plt.show()

# === Inference JSON ===
def export_signals(agent, df, window_size=60, path="signals.json"):
    env = CryptoTradingEnv(df, window_size=window_size)
    state = env.reset()
    done = False
    results = []

    while not done:
        action = agent.act(state, exploit=True)
        results.append({0: "hold", 1: "buy", 2: "sell"}[action])
        state, _, done, _ = env.step(action)

    with open(path, "w") as f:
        json.dump(results, f, indent=4)
    print(f"📄 Signals saved to {path}")

# === Main ===
if __name__ == "__main__":
    CSV_PATH = r"D:\AutoQuant\BNBUSDT_last_1500.csv"
    df = load_data(CSV_PATH)
    env = CryptoTradingEnv(df)
    agent = Agent(state_size=env.observation_space.shape[0], action_size=3, device="cuda" if torch.cuda.is_available() else "cpu")

    train(agent, env, episodes=300)
    agent.load("dqn_model.pth")
    export_signals(agent, df)
    evaluate(agent, df)
