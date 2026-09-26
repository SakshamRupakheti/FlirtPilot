import Foundation

// A deliberately small, deterministic editor. Not an LLM or a mind-reading model.
public enum OfflineEditor {
    public struct Edit: Equatable {
        public let label: String
        public let text: String
        public init(label: String, text: String) { self.label = label; self.text = text }
    }
    public static func edits(_ draft: String) -> [Edit] {
        guard !draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, draft.count <= 500 else { return [] }
        // Leave URLs, addresses and multiline content alone rather than damage them.
        guard !draft.contains("://"), !draft.contains("@"), !draft.contains("\n") else { return [] }
        let spaced = draft.replacingOccurrences(of: "[ \\t]{2,}", with: " ", options: .regularExpression)
            .replacingOccurrences(of: " +([,!?])", with: "$1", options: .regularExpression)
        var clean = spaced
        for (pattern, replacement) in [("\\bim\\b", "I'm"), ("\\bdont\\b", "don't"), ("\\bcant\\b", "can't"), ("\\bthats\\b", "that's")] {
            clean = clean.replacingOccurrences(of: pattern, with: replacement, options: .regularExpression)
        }
        // No invented invitation, romantic intent, tense, names or context.
        var choices: [Edit] = []
        if spaced != draft { choices.append(Edit(label: "Spacing", text: spaced)) }
        if clean != draft && clean != spaced { choices.append(Edit(label: "Apostrophes", text: clean)) }
        return Array(choices.prefix(3))
    }
    public static func nextWords(_ draft: String) -> [String] {
        guard draft.last == " " else { return [] }
        let text = draft.lowercased().trimmingCharacters(in: .whitespaces)
        for (suffix, choices) in [
            ("want to", ["grab", "talk", "meet"]),
            ("see you", ["soon", "there", "tomorrow"]),
            ("thank", ["you", "you!", "you so much"]),
            ("how was", ["your", "it", "today"]),
            ("sounds", ["good", "fun", "great"]),
        ] where text == suffix || text.hasSuffix(" " + suffix) { return choices }
        return []
    }
}

// An edit applies only to the exact document/cursor snapshot that produced it.
public struct DraftSnapshot: Equatable {
    public let before: String
    public let after: String
    public let documentID: UUID
    public init(before: String, after: String, documentID: UUID) {
        self.before = before; self.after = after; self.documentID = documentID
    }
}
