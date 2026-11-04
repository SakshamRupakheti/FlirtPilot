import SwiftUI

@main
struct FlirtPilotApp: App {
    var body: some Scene { WindowGroup { SetupView().preferredColorScheme(.dark) } }
}

struct SetupView: View {
    @State private var endpoint = Settings.endpoint
    @State private var token = ""
    @State private var status = ""
    @State private var draft = ""
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Your words. A little smoother.").font(.title2.bold())
                    Text("Word completions work on your iPhone. AI suggestions are optional and sent only when you tap Rewrite or Reply.")
                }
                Section("Turn on your keyboard") {
                    Text("1. Open iPhone Settings → General → Keyboard → Keyboards → Add New Keyboard → FlirtPilot.")
                    Text("2. In a supported chat app, hold the globe key and select FlirtPilot.")
                    Text("3. Confirm you and the person you are talking to are both 18+ in the keyboard.")
                    Text("Allow Full Access only if you want network AI. Local word completion works without it. Some apps and secure fields require Apple’s keyboard.")
                }
                Section("Try typing") {
                    TextField("Switch to FlirtPilot using the globe key", text: $draft, axis: .vertical)
                }
                Section("Optional AI connection") {
                    Text("Use a trusted FlirtPilot server’s HTTPS /api/keyboard address and its keyboard device token. Never enter an OpenAI key here. Your laptop’s localhost address cannot be reached from this iPhone.")
                    TextField("https://your-server/api/keyboard", text: $endpoint)
                        .keyboardType(.URL).textInputAutocapitalization(.never).autocorrectionDisabled()
                    SecureField("Keyboard device token", text: $token)
                        .textInputAutocapitalization(.never).autocorrectionDisabled()
                    Button("Save connection") {
                        let old = Settings.endpoint
                        Settings.endpoint = endpoint.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard Settings.validURL != nil, token.count >= 32, token.count <= 512 else {
                            Settings.endpoint = old
                            status = "Enter an HTTPS /api/keyboard URL and a 32–512 character device token."
                            return
                        }
                        guard Settings.saveToken(token) else {
                            Settings.endpoint = old
                            status = "Could not save securely. Check the app’s signing and Keychain Sharing setup."
                            return
                        }
                        token = ""
                        status = "Connection saved securely. Enable Full Access to use AI in the keyboard."
                    }
                    Button("Remove connection", role: .destructive) {
                        Settings.clear(); endpoint = ""; token = ""; status = "Connection removed."
                    }
                    if !status.isEmpty { Text(status).font(.footnote).accessibilityLabel(status) }
                }
                Section("Your context stays yours") {
                    Text("The keyboard cannot read the chat history. To get a reply, type or paste their message into the draft field, tap Reply, review a suggestion and tap it to replace that excerpt. Nothing is sent to the other person automatically. The current draft is sent to your configured server only for that request; no clipboard monitoring or keystroke uploads.")
                }
            }.navigationTitle("FlirtPilot").tint(.pink)
        }
    }
}
