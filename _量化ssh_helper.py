"""SSH 助手：通过 HTTP 代理连接服务器执行命令/上传/下载文件。
用法:
  python3 _ssh_helper.py cmd "<shell 命令>"
  python3 _ssh_helper.py upload <local> <remote>
  python3 _ssh_helper.py download <remote> <local>
"""
import sys
import socks
import paramiko

HOST = "45.32.252.56"
PORT = 22
USER = "root"
PWD = ".5eF_5R[b#nx9T+a"
PROXY_HOST = "127.0.0.1"
PROXY_PORT = 18080


def make_client():
    s = socks.socksocket()
    s.set_proxy(socks.HTTP, PROXY_HOST, PROXY_PORT)
    s.connect((HOST, PORT))
    cli = paramiko.SSHClient()
    cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    cli.connect(HOST, port=PORT, username=USER, password=PWD, sock=s, timeout=30,
                allow_agent=False, look_for_keys=False)
    return cli


def run_cmd(cmd: str, timeout: int = 60):
    cli = make_client()
    try:
        stdin, stdout, stderr = cli.exec_command(cmd, timeout=timeout)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()
        sys.stdout.write(out)
        if err:
            sys.stderr.write("\n[STDERR]\n" + err)
        sys.exit(code)
    finally:
        cli.close()


def upload(local: str, remote: str):
    cli = make_client()
    try:
        sftp = cli.open_sftp()
        sftp.put(local, remote)
        sftp.close()
        print(f"OK uploaded {local} -> {remote}")
    finally:
        cli.close()


def download(remote: str, local: str):
    cli = make_client()
    try:
        sftp = cli.open_sftp()
        sftp.get(remote, local)
        sftp.close()
        print(f"OK downloaded {remote} -> {local}")
    finally:
        cli.close()


if __name__ == "__main__":
    action = sys.argv[1]
    if action == "cmd":
        run_cmd(sys.argv[2], timeout=int(sys.argv[3]) if len(sys.argv) > 3 else 60)
    elif action == "upload":
        upload(sys.argv[2], sys.argv[3])
    elif action == "download":
        download(sys.argv[2], sys.argv[3])
    else:
        print("unknown action")
        sys.exit(1)