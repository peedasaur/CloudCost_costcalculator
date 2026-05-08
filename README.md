☁️ CloudCost — Cloud Spending Calculator

Stop guessing what you're spending on the cloud. CloudCost gives you a clear picture of your AWS, Azure, and GCP costs — and actually tells you what to do about it.

🔗 Live Demo: cloudcost-93qq.onrender.com

What it does
CloudCost is a lightweight FinOps dashboard that helps you monitor, analyze, and optimize your cloud spending across the three major providers. You get a clean interface, cost breakdowns, and actionable recommendations — no bloated SaaS subscription required.

📊 Track spending across AWS, Azure, and GCP in one place
💡 Get optimization recommendations baked right in
🐳 Deploy anywhere with Docker in under a minute


Getting started
Run locally:
bashgit clone https://github.com/peedasaur/CloudCost_costcalculator.git
cd CloudCost_costcalculator
npm install
node server.js
Then open http://localhost:3000 in your browser.
Run with Docker:
bashdocker build -t cloudcost .
docker run -p 3000:3000 cloudcost

Tech stack
LayerTechBackendNode.js + ExpressFrontendVanilla JS, HTML, CSSDeployDocker / Render

Project structure
├── server.js      # Express server
├── index.html     # Main UI
├── script.js      # Frontend logic
├── style.css      # Styles
├── Dockerfile     # Container setup
└── package.json

Contributing
Found a bug or have an idea? Open an issue or send a PR — contributions are welcome.

Built to make cloud cost visibility simple and accessible.
