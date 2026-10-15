# FireWatch — PX4 Autonomous Flight Simulation

## Project Overview

This repository contains the autonomous flight simulation developed for the FireWatch Senior Design project.

The demonstration uses PX4 SITL, Gazebo, and MAVSDK-Python to control an X500 quadcopter without manual flight input.

### Mission Sequence

1. Connect to the simulated PX4 flight controller.
2. Verify that position and home estimates are available.
3. Arm the drone.
4. Take off to approximately 10 meters.
5. Hover for 10 seconds.
6. Land automatically.
7. Confirm automatic disarming.

The script continuously reports GPS position, relative altitude, and battery percentage.

## Tested Development Environment

| Component | Tested configuration |
|---|---|
| Host operating system | Windows with WSL2 |
| Linux environment | Ubuntu 22.04 |
| Flight controller | PX4 SITL |
| PX4 Git revision | 615802aac9 (short SHA) |
| Simulator | Gazebo 8.15.0 |
| Simulated vehicle | X500 quadcopter |
| Communication | MAVLink over UDP port 14540 |
| Python interface | mavsdk-grpc |
| Python dependencies | See requirements.txt |

For best reproducibility, use the full PX4 commit SHA from the development machine and the pinned Python packages.

## Repository Structure

```text
firewatch-simulation/
├── autonomous_flight.py
├── connection_test.py
├── requirements.txt
├── README.md
└── .gitignore
```

## Installation Instructions

### 1. Install WSL2 and Ubuntu

On Windows, open PowerShell as Administrator:

```powershell
wsl --install -d Ubuntu-22.04
```

Restart if required, launch Ubuntu, and create a Linux user.

Verify the installation from PowerShell:

```powershell
wsl -l -v
```

Ubuntu should appear with WSL version 2.

### 2. Install PX4 and Gazebo

Inside Ubuntu:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install git curl wget ca-certificates -y

cd ~
git clone https://github.com/PX4/PX4-Atopilot.git --recursive

cd ~/PX4-Autopilot
git checkout 615802aac9
git submodule update --init --recursive

bash Tools/setup/ubuntu.sh
```

Complete any prompts and restart WSL if required:

```powershell
wsl --shutdown
```

The setup script installs PX4 build dependencies and the supported Gazebo simulation environment.

PX4 documentation: https://docs.px4.io/main/en/dev_setup/dev_env_windows_wsl

### 3. Launch the Simulator

Open Ubuntu:

```bash
cd ~/PX4-Autopilot
make px4_sitl gz_x500
```

Leave this terminal running.

Successful startup should display the Gazebo environment with an X500 quadcopter and a PX4 `pxh>` console.

### 4. Download the FireWatch Project

Download or clone the shared FireWatch simulation repository into your Ubuntu home directory.

Navigate to the directory containing `autonomous_flight.py` and `requirements.txt`.

### 5. Set Up Python

```bash
sudo apt install python3-pip python3-venv -y

git clone https://github.com/milaKnickerbocker/seniorDesign.git
cd seniorDesign/drone-simulation

python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

### 6. Test MAVSDK Connectivity

Keep Gazebo running in another terminal.

Run:

```bash
python connection_test.py
```

Expected behavior:

- PX4 connection succeeds.
- GPS coordinates are displayed.
- Altitude and battery telemetry are displayed.
- The test finishes successfully.

### 7. Execute the Autonomous Mission

With Gazebo and PX4 still running:

```bash
python autonomous_flight.py
```

Do not manually arm, take off, or land the drone.

The script should automatically execute the entire flight sequence.

### 8. Verify Mission Completion

Look for:

```text
Target altitude reached: ...
Hover period complete: 10.0 s
Landing confirmed.
Drone disarmed.
MISSION COMPLETE: SUCCESS
```

Review the generated log:

```bash
cat flight_log.txt
```

Optionally confirm the PX4 flight-controller state by typing `commander status` in the PX4 console.

### 9. Confirm Independent Reproduction

The verifier should record:

- OS and WSL version
- PX4 Git commit
- Gazebo version
- Python and mavsdk-grpc versions
- Whether the simulator launched
- Whether connection_test.py passed
- Whether autonomous_flight.py completed successfully
- Any deviations, troubleshooting steps, or errors

## Troubleshooting

**Connection timeout:** Verify PX4 SITL is running and the MAVLink UDP connection is available on port 14540.

**Gazebo window missing:** Check that WSLg graphics support works correctly.

**Arming rejected:** Inspect PX4 console messages and preflight checks.

**Position check times out:** Confirm Gazebo is running and PX4 receives valid position estimates.

**Altitude not reached:** Inspect PX4's flight state, Gazebo simulation state, and any failsafe messages.

**Battery falls rapidly:** The simulated battery model may not represent realistic flight endurance.

## Initial Test Results

The initial development-machine flight completed successfully.

- Maximum recorded altitude: 10.04 m
- Hover duration: 10.0 seconds
- Total elapsed mission time: approximately 40 seconds
- Automatic landing: successful
- Automatic disarming: confirmed
- Telemetry logging: successful

## Project Limitations

This demonstration uses a simulated PX4-compatible X500 vehicle. It does not establish software flight-control compatibility with FireWatch's physical DJI drones.

The flight-control proof of concept is independent of the project's wildfire detection and computer vision pipeline.

## References

- PX4 documentation: https://docs.px4.io/
- PX4 Gazebo simulation: https://docs.px4.io/main/en/sim_gazebo_gz/
- MAVSDK-Python: https://github.com/mavlink/MAVSDK-Python
- Gazebo: https://gazebosim.org/

## Verification

Primary developer: FireWatch Drone Control and Management

Independent verifier: Justin

Verification status: Pending independent execution.

Evidence: Screen recording and flight log to be provided through the team's SharePoint workspace.
