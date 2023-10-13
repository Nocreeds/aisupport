const vscode = require('vscode');
const OpenAi = require('openai');
function activate(context) {

    const config = vscode.workspace.getConfiguration('aisupport');

    vscode.window.createWebviewPanel
    const provider = new OpenAiViewProvider(context.extensionUri);
    provider.setApi( config.get('apikey'),config.get('organization'));
    console.log("Hey")
    console.log(config.get('apikey'),config.get('organization'));
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(OpenAiViewProvider.viewType, provider, {
        webviewOptions: { retainContextWhenHidden: true }
    }));
    context.subscriptions.push();
    const commandHandler = (usercommand, syscommand) => {
     provider.askAi(config.get(usercommand),config.get(syscommand));
    };
    const commandExplain = vscode.commands.registerCommand('aisupport.explain', () => {
        commandHandler('promptPrefix.explain', 'system.explain');
    });
    const commandRefactor = vscode.commands.registerCommand('aisupport.refactor', () => {
        commandHandler('promptPrefix.refactor', 'system.refactor');
    });
    const commandOptimize = vscode.commands.registerCommand('aisupport.optimize', () => {
        commandHandler('promptPrefix.optimize', 'system.optimize');
    });
    const commandSecure = vscode.commands.registerCommand('aisupport.secure', () => {
        commandHandler('promptPrefix.secure', 'system.secure');
    });
    context.subscriptions.push(commandExplain, commandRefactor, commandOptimize, commandSecure);
}
exports.activate = activate;

class OpenAiViewProvider{

    constructor(_extensionUri)  {
        this._extensionUri = _extensionUri;
    }

    setApi (apiKey, organization) {
        this.openai = new OpenAi.OpenAI({
            apiKey: apiKey,
            organization: organization
        });
    }
    
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // set options for the webview
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        // set the HTML for the webview
        this._view.webview.html = this._getHtmlForWebview(webviewView.webview);
        // add an event listener for messages received by the webview
        this._view.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'codeSelected':
                    {
                        // do nothing if the pasteOnClick option is disabled
                        let code = data.value;
                        code = code.replace(/([^\\])(\$)([^{0-9])/g, "$1\\$$$3");
                        // insert the code as a snippet into the active text editor
                        vscode.window.activeTextEditor.insertSnippet(new vscode.SnippetString(code));
                        break;
                    }
                    case 'prompt':
                    {
                        this.askAi(data.value);
                    }
            }
            
        });
    }

    async askAi(system,content){

        if (!this._view) {
            await vscode.commands.executeCommand('aisupport.chatView.focus');
        }
        else {
            this._view.show(true);
        }
        let prompt = '';
        const selection = vscode.window.activeTextEditor.selection;
        const selectedText = vscode.window.activeTextEditor.document.getText(selection);
        if (selection && selectedText) {
            // If there is a selection, add the prompt and the selected text to the search prompt
                prompt = `${content}\n\`\`\`\n${selectedText}\n\`\`\``;
        }
        else {
            // Otherwise, just use the prompt if user typed it
                prompt = content;
        }

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: prompt }
                ],
                model: "gpt-3.5-turbo",
            });
            
            const response = completion.choices[0].message;
            if (this._view) {
                this._view.show(true);

                this._view.webview.postMessage({ type: 'addResponse', value: response });
            }
        } catch (error) {
            console.error(error);
            return 'An error occurred while processing the request.';
        }
        console.log("Answer")
    }

    

    _getHtmlForWebview(webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        const microlightUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'scripts', 'microlight.min.js'));
        const tailwindUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'scripts', 'showdown.min.js'));
        const showdownUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'scripts', 'tailwind.min.js'));
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<script src="${tailwindUri}"></script>
				<script src="${showdownUri}"></script>
				<script src="${microlightUri}"></script>
				<style>
				.code {
					white-space : pre;
				</style>
			</head>
			<body>
				<input class="h-10 w-full text-white bg-stone-700 p-4 text-sm" type="text" id="prompt-input" />

				<div id="response" class="pt-6 text-sm">
				</div>

				<script src="${scriptUri}"></script>
			</body>
			</html>`;
    }

}
OpenAiViewProvider.viewType = 'aisupport.chatView';
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
