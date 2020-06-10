# isitavailable
CS 97 web application

To run:

1) Clone repository into local directory
2) Change directory into ../isitavailable/isitavailable and run npm install (note that inside the isitavailable folder there is another folder named the same thing so make sure to cd isitavailable twice)
3) In a separate shell, change directory into ../isitavailable/isitavailable/node_modules/cors-anywhere and run the command "node server.js". This is necessary for loading markers and location data.
4) Add a .env.local file (path should be ../isitavailable/isitavailable/.env.local) with the following configuration variables:

REACT_APP_GOOGLE_MAPS_API_KEY=XXXXX<br/>
REACT_APP_FIREBASE_API_KEY=XXXXX<br/>
REACT_APP_FIREBASE_AUTH_DOMAIN=XXXXX<br/>
REACT_APP_FIREBASE_DATABASE_URL=XXXXX<br/>
REACT_APP_PROJECT_ID=XXXXX<br/>
REACT_APP_STORAGE_BUCKET=XXXXX<br/>
REACT_APP_MESSAGING_SENDER_ID=XXXXX

5) Run npm start
