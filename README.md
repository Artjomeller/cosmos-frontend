# Project Name - Cosmos Odyssey

This document provides the setup instructions for the frontend component of the C D. It assumes that the backend is already up and running.

## Prerequisites

Before proceeding, ensure the following is installed:
- Node.js (visit [Node.js](https://nodejs.org/) to download)
- React Scripts (`npm install react-scripts --save`)

## Frontend Setup

Follow these steps to get the frontend running on your local machine:

### Configure the Environment

1. **Navigate to your frontend (client) directory** where the `package.json` file is located.

### Update `package.json`

2. **Modify your `package.json`** to include the necessary script to start the frontend:
   ```json
   "start": "set PORT=3001 && react-scripts start"
