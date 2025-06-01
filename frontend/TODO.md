## TODOs

1> Recent files - to be able to be ran?
2> query panel and all the buttons, etc in it
3> visual
4> llm
5> TS issues


29/05/2025:
0> add good charts
1> connect geenrated query from inspector to query panel
2> make the panel wider
3> autosize sidebar
3> test out with some files



# Inspector
0> download
1> Generated query
    - connect geenrated query from inspector to query panel
2> STRUCT be able to have charts as well
3> Make the panel wider like full screen maybe?


# DuckDB
0> memory management - resolved 

# self hosting
0> 


# privacy page
0> privacy.datakit.page


XY





Next Phase Options
Based on our earlier discussion, here are the next distribution channels to tackle:
1. Python Package 📊
Perfect for data scientists and analysts - your core audience!

Bundle static files with Python HTTP server
pip install datakit
Similar CLI experience but Python-native

2. Homebrew Formula 🍺
Mac developers love Homebrew - easy wins here

brew install datakit
Wraps your Node CLI or creates standalone

3. Docker Container 🐳
Enterprise-friendly, addresses security concerns directly

docker run -p 8080:80 datakit/app
Perfect for corporate environments

4. Additional Package Managers

APT/YUM packages for Linux users
Chocolatey for Windows users
Snap packages for Ubuntu users

My Recommendation: Python Package Next
Since your target audience includes lots of data scientists, and Python is their native language, I think the Python package would give you the biggest impact next.
Benefits:

Huge overlap with your target market
Data scientists trust pip install
No Node.js dependency concerns
Could even add Python-specific features later

Questions to clarify direction:

Python package priority - Does this sound right, or would you prefer Docker/Homebrew first?
Python implementation approach - Bundle static files + Python server, or wrap the Node CLI?
Feature parity - Same exact functionality as Node CLI, or any Python-specific additions?
Package name - datakit (if available) or datakit-py?

Or if you want to tackle a different distribution method first, let me know! Each one targets different user types:

Docker = Enterprise/DevOps users
Homebrew = Mac developers
Python = Data scientists

What feels like the right next move for your user base? 🚀