<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SKYPER-MD Dashboard</title>
<style>
    body {
        background: #0a0a0a;
        color: white;
        font-family: 'Poppins', sans-serif;
        text-align: center;
        padding: 20px;
    }
    h1 { margin-bottom: 30px; }
   .dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 15px;
        max-width: 900px;
        margin: auto;
    }
   .card {
        background: #1a1a1a;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 0 15px rgba(255,255,255,0.05);
        transition: 0.3s;
    }
   .card:hover { transform: translateY(-5px); box-shadow: 0 0 25px rgba(0,255,255,0.2); }
   .icon { font-size: 35px; margin-bottom: 10px; }
   .title { font-size: 14px; color: #aaa; }
   .value { font-size: 22px; font-weight: bold; margin-top: 5px; }
   .pair-btn {
        margin-top: 30px;
        padding: 12px 25px;
        background: black;
        border: none;
        border-radius: 10px;
        color: white;
        cursor: pointer;
    }
</style>
</head>
<body>

<h1>🤖 SKYPER-MD Dashboard</h1>

<div class="dashboard">
    <div class="card">
        <div class="icon">🌷</div>
        <div class="title">Users</div>
        <div class="value" id="users">0</div>
    </div>

    <div class="card">
        <div class="icon">🖥</div>
        <div class="title">TTL Bots Connected</div>
        <div class="value" id="ttlBots">0</div>
    </div>

    <div class="card">
        <div class="icon">🔥</div>
        <div class="title">Online Bots</div>
        <div class="value" id="onlineBots">0</div>
    </div>

    <div class="card">
        <div class="icon">✨</div>
        <div class="title">Speed</div>
        <div class="value" id="speed">0ms</div>
    </div>

    <div class="card">
        <div class="icon">📂</div>
        <div class="title">TTL Cmds Used</div>
        <div class="value" id="ttlCmds">0</div>
    </div>
</div>

<button class="pair-btn" onclick="window.location.href='/pair'">🔑 Go to Pair Code</button>

<script>
async function loadStats() {
    const res = await fetch('/api/insights')
    const data = await res.json()
    document.getElementById('users').innerText = data.users
    document.getElementById('ttlBots').innerText = data.ttlBots
    document.getElementById('onlineBots').innerText = data.onlineBots
    document.getElementById('speed').innerText = data.speed
    document.getElementById('ttlCmds').innerText = data.ttlCmds
}
loadStats()
setInterval(loadStats, 5000) // refresh every 5s
</script>

</body>
</html>
