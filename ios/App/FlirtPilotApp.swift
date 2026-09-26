import SwiftUI

@main
struct FlirtPilotApp: App {
    var body: some Scene { WindowGroup { PilotView().preferredColorScheme(.dark) } }
}
struct PilotView: View {
    @State private var draft = ""
    @State private var typingWorked = false, polishWorked = false, switchingWorked = false
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Text("Your words. A little smoother.").font(.title2.bold())
                    Text("PRIVATE KEYBOARD PILOT").font(.caption.bold()).foregroundStyle(.pink)
                    Text("Apple’s dictionary and small editing rules run on your phone. No server, account, laptop connection, API key or Full Access. This is not yet the conversation-understanding AI.")
                }
                Section("Enable once") {
                    Text("Settings → General → Keyboard → Keyboards → Add New Keyboard → FlirtPilot Pilot.")
                    Text("Hold the globe key in a text field and choose FlirtPilot Pilot. Confirm everyone is 18+ in the keyboard.")
                    Text("Some apps and password fields require Apple’s keyboard.")
                }
                Section("Try it here") {
                    TextField("Switch keyboards using the globe key", text: $draft, axis: .vertical).lineLimit(3...6)
                    Button("Load cleanup example") { draft = "im  free tomorrow !" }
                    Text("Tap Polish, select a cleanup, then Undo. Nothing is sent anywhere.").font(.footnote)
                }
                Section("Your pilot checklist") {
                    Toggle("Typing and word suggestions feel responsive", isOn: $typingWorked)
                    Toggle("Polish and Undo preserve my draft", isOn: $polishWorked)
                    Toggle("Globe switching works in a chat app", isOn: $switchingWorked)
                    Text("Checks stay in this screen’s memory. Tell the builder what worked; there is no automatic feedback upload.").font(.footnote)
                }
                Section("Still to come") {
                    Text("Safe / Bold / Risky AI replies, conversation interpretation and broader language support need a separately tested model. They are not simulated by this pilot.")
                }
            }.navigationTitle("FlirtPilot Pilot").tint(.pink)
        }
    }
}
