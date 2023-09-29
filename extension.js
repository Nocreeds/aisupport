const vscode = require('vscode');
const { default: axios } = require('axios');

function activate(context) {
    const disposable = vscode.commands.registerCommand('extension.startChatGPT', () => {
        // Create and show a webview to interact with ChatGPT
        const panel = vscode.window.createWebviewPanel(
            'chatGPT',
            'ChatGPT',
            vscode.ViewColumn.One,
            {}
        );

        // Handle user input and send requests to ChatGPT
        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'sendChatMessage') {
                // Send user message to ChatGPT API
                axios.post('CHATGPT_API_URL', { text: message.text })
                    .then((response) => {
                        // Display ChatGPT's response in the webview
                        panel.webview.postMessage({ command: 'updateChat', text: response.data.text });
                    })
                    .catch((error) => {
                        console.error(error);
                    });
            }
        });

        // Load your HTML file for the webview (containing the chat interface)
        panel.webview.html = getWebviewContent();
    });

    context.subscriptions.push(disposable);
}

function getWebviewContent() {
    // Generate HTML content dynamically
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>ChatGPT Webview</title>
        </head>
        <body>
            <h1>Welcome to ChatGPT</h1>
            <div id="chat-container">
                <!-- Chat messages will be displayed here -->
            </div>
            <input type="text" id="user-input" placeholder="Type your message...">
            <button id="send-button">Send</button>
            <script>
                // JavaScript code to handle chat interactions
            </script>
        </body>
        </html>
    `;

    return htmlContent;
}



// this method is called when your extension is deactivated
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
