import os
import subprocess
import paramiko

env_file = os.path.join(os.path.dirname(__file__), "..", ".env.vps")
env = {}
if os.path.exists(env_file):
    with open(env_file, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()

key_path = os.path.expanduser("~/.ssh/id_ed25519")
pub_path = key_path + ".pub"

if not os.path.exists(key_path):
    subprocess.run(["ssh-keygen", "-t", "ed25519", "-N", "", "-f", key_path], check=True)

with open(pub_path, "r") as f:
    pub_key = f.read().strip()

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(
    env.get("VPS_IP", "199.246.88.141"),
    port=int(env.get("VPS_PORT", 22)),
    username=env.get("VPS_USER", "root"),
    password=env.get("VPS_PASS", ""),
    timeout=10,
)

cmd = f'mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "{pub_key}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
stdin, stdout, stderr = client.exec_command(cmd)
stdout.channel.recv_exit_status()
client.close()
print("SUCCESS: SSH public key added to authorized_keys on VPS.")
