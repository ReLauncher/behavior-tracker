# Behavior Tracker
-----
## What this is for?
Behavior Tracker logs users activity (key presses, mouseclicks, tab visibility) on your website, so that you can view it in realtime on Firebase or download in .CSV format and analyse locally.

## Setup
1. create a bucket at [firebase](http://firebase.google.com)
2. integrate with your website: 
```html
  <script src="https://raw.githubusercontent.com/ReLauncher/behavior-tracker/master/logger.js"></script>
  <script>
  BT.init({
    firebase_bucket: "YOUR_FIREBASE_BUCKET_NAME",
    page_id: "ID_OF_CURRENT_PAGE_YOU_TRACK",
    unit_id:"OPTIONAL_ID_OF_CURRENT_DATAITEM", 
    user_id: "OPTIONAL_ID_OF_CURRENT_USER"
  });
  </script>
```

## TRACK
1. Go to console.firebase.google.com/project/YOUR_FIREBASE_BUCKET_NAME/database/data/ and browse users behavior in real time
2. Download .csv files with logs:
```bash
cd csv_generator
npm install requestify
.generate_logs.sh https://YOUR_FIREBASE_BUCKET.firebaseio.com/YOUR_WEBSITE YOUR_PAGE_ID
```

