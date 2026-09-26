import UIKit

final class KeyboardViewController: UIInputViewController {
    private let words = WordSuggestions()
    private let api = KeyboardAPI()
    private let root = UIStackView()
    private let letterRows = UIStackView()
    private let suggestionRow = UIStackView()
    private let aiRows = UIStackView()
    private let status = UILabel()
    private var shift = false
    private var symbols = false
    private var vibe = "Chill"
    private var request: Task<Void, Never>?
    private var generation = 0
    private var debounce: DispatchWorkItem?
    private var accepted: Bool { UserDefaults.standard.bool(forKey: "adult-confirmed") }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.08, green: 0.04, blue: 0.07, alpha: 1)
        root.axis = .vertical; root.spacing = 6
        root.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(root)
        NSLayoutConstraint.activate([
            root.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 5),
            root.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -5),
            root.topAnchor.constraint(equalTo: view.topAnchor, constant: 6),
            root.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -6),
        ])
        let height = view.heightAnchor.constraint(equalToConstant: 420)
        height.priority = .defaultHigh; height.isActive = true
        build()
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        cancelPending()
    }
    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        changed()
    }
    private func clear(_ stack: UIStackView) {
        for view in stack.arrangedSubviews { stack.removeArrangedSubview(view); view.removeFromSuperview() }
    }
    private func button(_ text: String, action: @escaping () -> Void) -> UIButton {
        let button = UIButton(type: .system)
        button.setTitle(text, for: .normal)
        button.setTitleColor(.white, for: .normal)
        button.backgroundColor = UIColor(white: 0.19, alpha: 1)
        button.layer.cornerRadius = 7
        button.titleLabel?.font = .systemFont(ofSize: 16)
        button.titleLabel?.adjustsFontSizeToFitWidth = true
        button.titleLabel?.minimumScaleFactor = 0.7
        button.accessibilityLabel = text
        button.addAction(UIAction { _ in action() }, for: .touchUpInside)
        return button
    }
    private func row(_ buttons: [UIButton], height: CGFloat = 38) -> UIStackView {
        let row = UIStackView(arrangedSubviews: buttons)
        row.axis = .horizontal; row.distribution = .fillEqually; row.spacing = 5
        row.heightAnchor.constraint(equalToConstant: height).isActive = true
        return row
    }
    private func globe() -> UIButton {
        let globe = UIButton(type: .system)
        globe.setImage(UIImage(systemName: "globe"), for: .normal)
        globe.tintColor = .white
        globe.accessibilityLabel = "Switch keyboard"
        globe.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        return globe
    }
    private func build() {
        clear(root)
        if !accepted {
            let explanation = UILabel()
            explanation.text = "FlirtPilot is for adults. Confirm you and the person you’re talking to are both 18+. Local word suggestions stay on your phone."
            explanation.textColor = .white; explanation.numberOfLines = 0
            root.addArrangedSubview(explanation)
            root.addArrangedSubview(button("We’re both 18+") { [weak self] in
                UserDefaults.standard.set(true, forKey: "adult-confirmed")
                self?.build()
            })
            root.addArrangedSubview(globe())
            return
        }
        let controls = row([
            button("Rewrite") { [weak self] in self?.generate(mode: "rewrite") },
            button("Reply") { [weak self] in self?.generate(mode: "reply") },
            button(vibe) { [weak self] in
                guard let self = self else { return }
                self.vibe = self.vibe == "Chill" ? "Funny" : self.vibe == "Funny" ? "Direct" : "Chill"
                self.cancelPending(); self.build()
            },
            button("Reset 18+") { [weak self] in
                self?.cancelPending()
                UserDefaults.standard.removeObject(forKey: "adult-confirmed")
                self?.build()
            },
        ])
        root.addArrangedSubview(controls)
        status.textColor = .lightGray; status.font = .systemFont(ofSize: 12)
        status.numberOfLines = 2; status.text = "Local word suggestions · AI only when tapped"
        root.addArrangedSubview(status)
        suggestionRow.axis = .horizontal; suggestionRow.distribution = .fillEqually; suggestionRow.spacing = 5
        root.addArrangedSubview(suggestionRow)
        aiRows.axis = .vertical; aiRows.spacing = 3
        clear(aiRows); root.addArrangedSubview(aiRows)
        letterRows.axis = .vertical; letterRows.spacing = 5
        root.addArrangedSubview(letterRows)
        buildKeys(); updateWords()
        let spacer = UIView(); spacer.setContentHuggingPriority(.defaultLow, for: .vertical)
        root.addArrangedSubview(spacer)
    }
    private func buildKeys() {
        clear(letterRows)
        let rows = symbols ? ["1234567890", "-/:;()$&@", ".,?!'\""] : ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
        for (index, letters) in rows.enumerated() {
            var buttons = letters.map { character -> UIButton in
                let text = shift && !symbols ? String(character).uppercased() : String(character)
                return button(text) { [weak self] in
                    guard let self = self else { return }
                    self.textDocumentProxy.insertText(text)
                    if self.shift { self.shift = false; self.buildKeys() }
                    self.changed()
                }
            }
            if index == 2 {
                buttons.insert(button(shift ? "⇧ ON" : "⇧") { [weak self] in
                    guard let self = self else { return }; self.shift.toggle(); self.buildKeys()
                }, at: 0)
                let delete = button("⌫") { [weak self] in self?.textDocumentProxy.deleteBackward(); self?.changed() }
                delete.accessibilityLabel = "Delete backward"
                buttons.append(delete)
            }
            letterRows.addArrangedSubview(row(buttons))
        }
        var bottom = [button(symbols ? "ABC" : "123") { [weak self] in
            guard let self = self else { return }; self.symbols.toggle(); self.buildKeys()
        }]
        if needsInputModeSwitchKey { bottom.append(globe()) }
        bottom.append(button("space") { [weak self] in self?.textDocumentProxy.insertText(" "); self?.changed() })
        bottom.append(button("return") { [weak self] in self?.textDocumentProxy.insertText("\n"); self?.changed() })
        letterRows.addArrangedSubview(row(bottom))
    }
    private func cancelPending() {
        generation += 1; request?.cancel(); request = nil
        debounce?.cancel(); clear(aiRows)
    }
    private func changed() {
        cancelPending()
        guard accepted else { return }
        // Hide old word buttons immediately; update after a short local-only pause.
        clear(suggestionRow)
        status.text = "Local word suggestions · AI only when tapped"
        let work = DispatchWorkItem { [weak self] in self?.updateWords() }
        debounce = work
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: work)
    }
    private func updateWords() {
        clear(suggestionRow)
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
        let suffix = words.currentWord(before)
        let choices = words.suggestions(for: before)
        for choice in choices {
            suggestionRow.addArrangedSubview(button(choice) { [weak self] in
                guard let self = self, self.textDocumentProxy.documentContextBeforeInput == before else { return }
                for _ in suffix { self.textDocumentProxy.deleteBackward() }
                self.textDocumentProxy.insertText(choice + " "); self.changed()
            })
        }
        suggestionRow.isHidden = choices.isEmpty
    }
    private func generate(mode: String) {
        cancelPending()
        guard accepted else { build(); return }
        guard hasFullAccess else { status.text = "AI needs Full Access. Local typing works without it."; return }
        guard Settings.validURL != nil, Settings.token() != nil else {
            status.text = "Set up an AI connection in the FlirtPilot app first."; return
        }
        let before = textDocumentProxy.documentContextBeforeInput ?? ""
        let after = textDocumentProxy.documentContextAfterInput ?? ""
        guard !before.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            status.text = mode == "reply" ? "Type their message in the draft field, then tap Reply." : "Type a draft, then tap Rewrite."; return
        }
        guard before.count <= 500, after.isEmpty else {
            status.text = "Move to the end of a draft of 500 characters or fewer."; return
        }
        status.text = mode == "reply" ? "Finding three replies…" : "Smoothing your draft…"
        let version = generation
        let selectedVibe = vibe
        request = Task { @MainActor [weak self] in
            guard let self = self else { return }
            do {
                let result = try await self.api.suggest(text: before, mode: mode, vibe: selectedVibe)
                guard !Task.isCancelled, self.generation == version,
                      self.textDocumentProxy.documentContextBeforeInput == before,
                      (self.textDocumentProxy.documentContextAfterInput ?? "") == after else { return }
                self.status.text = result.message ?? result.error ?? "Tap to replace the visible draft excerpt. Review before sending."
                for (index, text) in (result.suggestions ?? []).enumerated() {
                    let label = ["Safe", "Bold", "Risky"][index]
                    let button = self.button("\(label): \(text)") { [weak self] in
                        guard let self = self, self.textDocumentProxy.documentContextBeforeInput == before,
                              (self.textDocumentProxy.documentContextAfterInput ?? "") == after else { return }
                        // Replace only the exact context used by this request. Never auto-send.
                        for _ in before { self.textDocumentProxy.deleteBackward() }
                        self.textDocumentProxy.insertText(text); self.changed()
                    }
                    button.titleLabel?.font = .systemFont(ofSize: 12)
                    button.heightAnchor.constraint(equalToConstant: 30).isActive = true
                    self.aiRows.addArrangedSubview(button)
                }
            } catch {
                guard !Task.isCancelled, self.generation == version else { return }
                self.status.text = "Couldn’t get AI suggestions. Check the connection; typing still works."
            }
        }
    }
}
