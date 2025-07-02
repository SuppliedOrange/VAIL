<div align="center">
    <br />
    <img src="./assets/logo.svg" width="122rem"/>
    <h1>VAIL</h1>
    <p>The <b>V</b>ALORANT <b>A</b>nti <b>I</b>nsta<b>L</b>ock Project</p>
    Check it out on <a href="https://vail-nu.vercel.app/">https://vail-nu.vercel.app/</a>
</div>

## About The Project

VAIL is a system designed to analyze VALORANT matches and discourage "instalocking" (instantly selecting a character without team discussion). It rewards players for good sportsmanship.

The project consists of three main components:
*   **Website**: A React-based frontend for user registration, login, and viewing match history and rewards.
*   **Webserver**: A Node.js (Express) backend that handles user data, match analysis, and crypto operations.
*   **Desktop Application**: A Python application that runs on the user's computer to monitor their VALORANT game activity.

## Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

*   Node.js and npm: [https://nodejs.org/](https://nodejs.org/)
*   Python: [https://www.python.org/](https://www.python.org/)
*   A MongoDB instance (local or cloud-hosted).

### Local Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/SuppliedOrange/VAIL.git
    cd VAIL
    ```

2.  **Webserver Setup:**
    *   Navigate to the `webserver` directory:
        ```sh
        cd webserver
        ```
    *   Install dependencies:
        ```sh
        npm install
        ```
    *   Create a `.env` file in the `webserver` directory and add your MongoDB connection string:
        ```
        MONGODB_URI="<your_mongodb_uri>"
        ```

3.  **Website Setup:**
    *   Navigate to the `website` directory:
        ```sh
        cd ../website
        ```
    *   Install dependencies:
        ```sh
        npm install
        ```
    *   Create a `.env` file in the `website` directory and add the following:
        ```
        VITE_WEBSERVER_ENDPOINT="http://localhost:3001"
        ```

4.  **Desktop Application Setup:**
    *   Navigate to the `pregame_checker` directory:
        ```sh
        cd ../pregame_checker
        ```
    *   Install Python dependencies:
        ```sh
        pip install -r requirements.txt
        ```

## Usage

To run the application, you must start all three components in the correct order.

1.  **Start the Webserver:**
    *   Navigate to the `webserver` directory and run:
        ```sh
        npx tsx index.ts
        ```
    *   The webserver will be running on `http://localhost:3001`.

2.  **Start the Website:**
    *   In a new terminal, navigate to the `website` directory and run:
        ```sh
        npm run dev
        ```
    *   The website will be available at `http://localhost:5173`.

3.  **Run the Desktop Application:**
    *   In another new terminal, from the **root** of the project directory, run:
        ```sh
        python pregame_checker/main.py
        ```

Once all components are running, you can:
1.  Open your browser and navigate to `http://localhost:5173` to use the website.
2.  The desktop application will launch and should appear in your system tray.

## Building the Application

To build the desktop application into a standalone executable, you can use `pyinstaller`.

1.  Install `pyinstaller`:
    ```sh
    pip install pyinstaller
    ```
2.  From the `pregame_checker` directory, run the following command:
    ```sh
    pyinstaller VAIL.spec
    ```
    The executable will be located in the `dist` directory.

## Contributors
<html>
<table>
  <tbody>
    <tr>
      <td align="center" valign="top"><a href="https://github.com/SuppliedOrange"><img src="https://avatars.githubusercontent.com/u/70258998?v=4" width="100rem;" alt="SuppliedOrange"/><br /><sub><b>SuppliedOrange</b></sub></a><br/></td>
        <td align="center" valign="top">
        <a href="https://github.com/Incognitux"><img src="https://avatars.githubusercontent.com/u/74859056?v=4" width="100rem;" alt="Incognitux"/><br /><sub><b>Incognitux</b></sub></a><br/>
        </td>
    </tbody>
</table>
</html>