import UIKit

final class KeyboardViewController: UIInputViewController {
    private let words = WordSuggestions()
    private let root = UIStackView(), keys = UIStackView(), predictions = UIStackView(), edits = UIStackView()
    private let status = UILabel()
    private var shift = false, symbols = false
    private var debounce: DispatchWorkItem?
    private var undo: (snapshot: DraftSnapshot, original: String, insertedCount: Int)?
    private var accepted: Bool { UserDefaults.standard.bool(forKey: "adult-confirmed") }
    private var snapshot: DraftSnapshot? {
        guard let before = textDocumentProxy.documentContextBeforeInput,
              textDocumentProxy.selectedText == nil else { return nil }
        return DraftSnapshot(before: before, after: textDocumentProxy.documentContextAfterInput ?? "", documentID: textDocumentProxy.documentIdentifier)
    }
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.065, green: 0.04, blue: 0.06, alpha: 1)
        root.axis = .vertical; root.spacing = 6; root.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(root)
        NSLayoutConstraint.activate([
            root.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 5),
            root.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -5),
            root.topAnchor.constraint(equalTo: view.topAnchor, constant: 6),
            root.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -6)])
        let height = view.heightAnchor.constraint(equalToConstant: 420)
        height.priority = .defaultHigh; height.isActive = true
        build()
    }
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated); debounce?.cancel(); undo = nil; clear(edits)
    }
    override func textDidChange(_ textInput: UITextInput?) { super.textDidChange(textInput); changed() }
    override func selectionDidChange(_ textInput: UITextInput?) { super.selectionDidChange(textInput); changed() }
    private func clear(_ stack: UIStackView) {
        for child in stack.arrangedSubviews { stack.removeArrangedSubview(child); child.removeFromSuperview() }
    }
    private func button(_ title: String, action: @escaping () -> Void) -> UIButton {
        let key = UIButton(type: .system)
        key.setTitle(title, for: .normal); key.setTitleColor(.white, for: .normal)
        key.backgroundColor = UIColor(white: 0.18, alpha: 1); key.layer.cornerRadius = 8
        key.titleLabel?.font = .systemFont(ofSize: 16)
        key.titleLabel?.adjustsFontSizeToFitWidth = true; key.titleLabel?.minimumScaleFactor = 0.7
        key.accessibilityLabel = title
        key.addAction(UIAction { _ in action() }, for: .touchUpInside)
        return key
    }
    private func row(_ buttons: [UIButton]) -> UIStackView {
        let row = UIStackView(arrangedSubviews: buttons)
        row.axis = .horizontal; row.spacing = 5; row.distribution = .fillEqually
        row.heightAnchor.constraint(equalToConstant: 40).isActive = true
        return row
    }
    private func globe() -> UIButton {
        let key = UIButton(type: .system)
        key.setImage(UIImage(systemName: "globe"), for: .normal); key.tintColor = .white
        key.accessibilityLabel = "Switch keyboard"
        key.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        return key
    }
    private func build() {
        clear(root)
        if !accepted {
            let label = UILabel(); label.numberOfLines = 0; label.textColor = .white
            label.text = "FlirtPilot private pilot. Confirm everyone is 18+. Everything in this pilot stays on your iPhone."
            root.addArrangedSubview(label)
            root.addArrangedSubview(row([button("We’re both 18+") { [weak self] in
                UserDefaults.standard.set(true, forKey: "adult-confirmed"); self?.build()
            }, globe()]))
            return
        }
        let tools = row([
            button("Polish") { [weak self] in self?.polish() },
            button("Undo") { [weak self] in self?.undoEdit() },
            button("Reset") { [weak self] in
                guard let self = self else { return }
                UserDefaults.standard.removeObject(forKey: "adult-confirmed")
                self.debounce?.cancel(); self.undo = nil; self.clear(self.edits); self.build()
            }])
        tools.arrangedSubviews.first?.backgroundColor = UIColor(red: 0.55, green: 0.12, blue: 0.3, alpha: 1)
        root.addArrangedSubview(tools)
        status.textColor = .lightGray; status.font = .systemFont(ofSize: 12); status.numberOfLines = 2
        status.text = "OFFLINE PILOT · Words + light cleanup · No AI connection"
        root.addArrangedSubview(status)
        predictions.axis = .horizontal; predictions.distribution = .fillEqually; predictions.spacing = 5
        root.addArrangedSubview(predictions)
        edits.axis = .vertical; edits.spacing = 4; clear(edits); root.addArrangedSubview(edits)
        keys.axis = .vertical; keys.spacing = 5; root.addArrangedSubview(keys)
        buildKeys(); updatePredictions()
        let spacer = UIView(); spacer.setContentHuggingPriority(.defaultLow, for: .vertical); root.addArrangedSubview(spacer)
    }
    private func insert(_ text: String) { textDocumentProxy.insertText(text); changed() }
    private func buildKeys() {
        clear(keys)
        let rows = symbols ? ["1234567890", "-/:;()$&@", ".,?!'\""] : ["qwertyuiop", "asdfghjkl", "zxcvbnm"]
        for (index, letters) in rows.enumerated() {
            var buttons = letters.map { character -> UIButton in
                let text = shift && !symbols ? String(character).uppercased() : String(character)
                return button(text) { [weak self] in
                    guard let self = self else { return }; self.insert(text)
                    if self.shift { self.shift = false; self.buildKeys() }
                }
            }
            if index == 2 {
                buttons.insert(button(shift ? "⇧ ON" : "⇧") { [weak self] in
                    guard let self = self else { return }; self.shift.toggle(); self.buildKeys()
                }, at: 0)
                let delete = button("⌫") { [weak self] in self?.textDocumentProxy.deleteBackward(); self?.changed() }
                delete.accessibilityLabel = "Delete backward"; buttons.append(delete)
            }
            keys.addArrangedSubview(row(buttons))
        }
        var bottom = [button(symbols ? "ABC" : "123") { [weak self] in
            guard let self = self else { return }; self.symbols.toggle(); self.buildKeys()
        }]
        if needsInputModeSwitchKey { bottom.append(globe()) }
        bottom += [button("space") { [weak self] in self?.insert(" ") }, button("return") { [weak self] in self?.insert("\n") }]
        keys.addArrangedSubview(row(bottom))
    }
    private func changed() {
        debounce?.cancel(); clear(edits); clear(predictions)
        if undo?.snapshot != snapshot { undo = nil }
        guard accepted else { return }
        status.text = "OFFLINE PILOT · Suggestions never send a message"
        let work = DispatchWorkItem { [weak self] in self?.updatePredictions() }
        debounce = work; DispatchQueue.main.asyncAfter(deadline: .now() + 0.12, execute: work)
    }
    private func updatePredictions() {
        clear(predictions)
        guard let original = snapshot else { return }
        let word = words.currentWord(original.before)
        let choices = word.isEmpty ? OfflineEditor.nextWords(original.before) : words.suggestions(for: original.before)
        for choice in choices {
            let key = button(choice) { [weak self] in
                guard let self = self, self.snapshot == original else { return }
                if let next = original.after.first, next.isLetter { return }
                for _ in word { self.textDocumentProxy.deleteBackward() }
                self.textDocumentProxy.insertText(choice + " "); self.changed()
            }
            key.heightAnchor.constraint(equalToConstant: 34).isActive = true
            predictions.addArrangedSubview(key)
        }
    }
    private func polish() {
        debounce?.cancel(); clear(edits)
        guard accepted, let original = snapshot, original.after.isEmpty else {
            status.text = "Move to the end of a short draft first."; return
        }
        let choices = OfflineEditor.edits(original.before)
        status.text = choices.isEmpty ? "No simple cleanup found. This pilot is not a chat-analysis AI." : "Tap a local edit to replace only this visible excerpt."
        for edit in choices {
            let key = button("\(edit.label): \(edit.text)") { [weak self] in
                guard let self = self, self.snapshot == original else { return }
                for _ in original.before { self.textDocumentProxy.deleteBackward() }
                self.textDocumentProxy.insertText(edit.text); self.changed()
                if let inserted = self.snapshot { self.undo = (inserted, original.before, edit.text.count) }
            }
            key.heightAnchor.constraint(equalToConstant: 34).isActive = true
            key.accessibilityLabel = "\(edit.label). \(edit.text). Replace visible draft."
            edits.addArrangedSubview(key)
        }
    }
    private func undoEdit() {
        guard let undo = undo, snapshot == undo.snapshot else { status.text = "Nothing to undo here."; return }
        for _ in 0..<undo.insertedCount { textDocumentProxy.deleteBackward() }
        textDocumentProxy.insertText(undo.original); self.undo = nil; changed()
        status.text = "Original draft restored."
    }
}
