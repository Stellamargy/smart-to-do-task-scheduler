# WSL Installation and MeTTa Setup Guide

## Step 1: Install WSL (Requires Administrator Rights)

1. **Open PowerShell as Administrator:**
   - Press `Windows + X`
   - Select "Windows PowerShell (Admin)" or "Terminal (Admin)"

2. **Run the WSL installation command:**
   ```powershell
   wsl --install
   ```

3. **Restart your computer when prompted**

4. **After restart, Ubuntu will automatically start and ask you to create a user account**

## Step 2: Install MeTTa in WSL

Once WSL is installed and you have Ubuntu running:

1. **Update the package manager:**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

2. **Install required dependencies:**
   ```bash
   sudo apt install -y build-essential git cmake pkg-config python3 python3-pip curl
   ```

3. **Install Rust (required for MeTTa):**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

4. **Clone and build MeTTa:**
   ```bash
   git clone https://github.com/trueagi-io/hyperon-experimental.git
   cd hyperon-experimental
   cargo build --release
   ```

5. **Install Python bindings:**
   ```bash
   cd python
   pip3 install -e .
   ```

## Step 3: Test MeTTa Installation

1. **Test MeTTa CLI:**
   ```bash
   ./target/release/metta
   ```

2. **Test Python bindings:**
   ```bash
   python3 -c "from hyperon import MeTTa; print('MeTTa imported successfully!')"
   ```

## Step 4: Access Your Project Files in WSL

Your Windows files are accessible in WSL at `/mnt/c/`:

```bash
cd /mnt/c/Users/user/Desktop/Projects/ai2/smart-to-do-task-scheduler
```

## Step 5: Install Python Dependencies in WSL

```bash
# Navigate to your project
cd /mnt/c/Users/user/Desktop/Projects/ai2/smart-to-do-task-scheduler/backend

# Install Python dependencies
pip3 install -r requirements.txt

# Test the scheduler with MeTTa
python3 -c "
from app.services.scheduler import TaskScheduler
scheduler = TaskScheduler()
print('Scheduler initialized with MeTTa support!')
"
```

## Alternative: Docker Setup for MeTTa

If WSL installation fails, you can use Docker:

1. **Create a Dockerfile:**
   ```dockerfile
   FROM ubuntu:22.04
   
   # Install dependencies
   RUN apt-get update && apt-get install -y \
       build-essential git cmake pkg-config \
       python3 python3-pip curl
   
   # Install Rust
   RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
   ENV PATH="/root/.cargo/bin:${PATH}"
   
   # Clone and build MeTTa
   RUN git clone https://github.com/trueagi-io/hyperon-experimental.git
   WORKDIR /hyperon-experimental
   RUN cargo build --release
   
   # Install Python bindings
   WORKDIR /hyperon-experimental/python
   RUN pip3 install -e .
   
   # Set working directory
   WORKDIR /app
   ```

2. **Build and run:**
   ```bash
   docker build -t metta-env .
   docker run -v "$(pwd):/app" -it metta-env /bin/bash
   ```

## Troubleshooting

### WSL Installation Issues:
- Ensure Windows features "Virtual Machine Platform" and "Windows Subsystem for Linux" are enabled
- Check if virtualization is enabled in BIOS
- Try `wsl --install -d Ubuntu-22.04` for a specific distribution

### MeTTa Build Issues:
- Ensure you have at least 4GB of free disk space
- If Rust installation fails, try manual installation from rustup.rs
- For memory issues during build, try `cargo build --release --jobs 1`

### Python Integration Issues:
- Make sure you're using the same Python version in WSL and Windows
- Install dependencies: `pip3 install hyperon pymongo flask`
- Check paths and environment variables

## Next Steps

Once WSL and MeTTa are installed:

1. Test the scheduler with actual MeTTa knowledge base
2. Verify MeTTa queries are working
3. Run the backend server in WSL environment
4. Connect the frontend to WSL backend if needed

## Benefits of WSL + MeTTa Setup

- **Native Linux environment** for MeTTa compilation
- **Better performance** than Windows emulation
- **Easy file sharing** between Windows and Linux
- **Full MeTTa feature support** including advanced reasoning
- **Consistent deployment environment** matching production
