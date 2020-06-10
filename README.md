# isitavailable
CS 97 web application

To run:

1) Clone and/or extract repository into local directory
2) Change directory into isitavailable/isitavailable and run npm install (note that inside the isitavailable folder containing the entire repository there is another folder with the same name so make sure to cd isitavailable two levels in after cloning/decompressing the repository)
3) In a separate shell, change directory into isitavailable/isitavailable/node_modules/cors-anywhere and run the command "node server.js". This hosts a cors-anywhere proxy locally (make sure it's on port 8080), which is neccessary for making certain API calls and loading map data. If any problems are encountered during this process, the same thing can be accomplished by: </br>
	 1. Cloning https://github.com/Rob--W/cors-anywhere into a separate directory</br>
	 2. Running npm install in the cloned directory</br>
	 3. Running node server.js</br>
	 
	 Alternatively, you can choose to change the value of proxyurl in App.js:86 to any cors-anywhere server (with a slash appended), such 	 as the publicly available https://cors-anywhere.herokuapp.com/
4) Add a .env.local file (in isitavailable/isitavailable/.env.local, the directory that contains public, src, etc.) with the following configuration variables:

REACT_APP_GOOGLE_MAPS_API_KEY=XXXXX<br/>
REACT_APP_FIREBASE_API_KEY=XXXXX<br/>
REACT_APP_FIREBASE_AUTH_DOMAIN=XXXXX<br/>
REACT_APP_FIREBASE_DATABASE_URL=XXXXX<br/>
REACT_APP_PROJECT_ID=XXXXX<br/>
REACT_APP_STORAGE_BUCKET=XXXXX<br/>
REACT_APP_MESSAGING_SENDER_ID=XXXXX

5) Run npm start
