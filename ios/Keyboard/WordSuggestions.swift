import UIKit

// Local spelling/completion only: no network, training data or chat persistence.
final class WordSuggestions {
    private let checker = UITextChecker()
    func currentWord(_ context: String) -> String {
        String(context.reversed().prefix { $0.isLetter || $0 == "'" || $0 == "’" }.reversed())
    }
    func suggestions(for context: String, language: String = "en_US") -> [String] {
        let word = currentWord(context)
        guard word.count >= 2, word.count < 40 else { return [] }
        let range = NSRange(location: 0, length: (word as NSString).length)
        let locale = UITextChecker.availableLanguages.contains(language) ? language : "en_US"
        let completions = checker.completions(forPartialWordRange: range, in: word, language: locale) ?? []
        let corrections = checker.guesses(forWordRange: range, in: word, language: locale) ?? []
        var seen = Set<String>()
        return (completions + corrections).filter { $0 != word && seen.insert($0).inserted }.prefix(3).map { $0 }
    }
}
