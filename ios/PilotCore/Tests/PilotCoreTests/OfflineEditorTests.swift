import XCTest
@testable import PilotCore

final class OfflineEditorTests: XCTestCase {
    func testPreservesTextingStyleAndScripts() {
        for text in ["lol yeah that's wild 😭", "kal kaha gayab thi 😭", "नमस्ते", "مرحبا", "maybe???"] {
            XCTAssertTrue(OfflineEditor.edits(text).isEmpty)
        }
    }
    func testCleanupDoesNotInventIntent() {
        XCTAssertEqual(OfflineEditor.edits("im  free tomorrow !").map(\.text), ["im free tomorrow!", "I'm free tomorrow!"])
        XCTAssertTrue(OfflineEditor.edits("i just wanted to ask if coffee works").isEmpty)
    }
    func testAvoidsEditingSensitiveStructures() {
        for text in ["https://example.com/im", "im@example.com", "im\nfree", String(repeating: "a", count: 501)] { XCTAssertTrue(OfflineEditor.edits(text).isEmpty) }
    }
    func testPredictionsNeedWholePhraseAndSpace() {
        XCTAssertEqual(OfflineEditor.nextWords("want to "), ["grab", "talk", "meet"])
        XCTAssertTrue(OfflineEditor.nextWords("want to").isEmpty)
        XCTAssertTrue(OfflineEditor.nextWords("unwant to ").isEmpty)
    }
    func testDocumentSwitchInvalidatesEditsEvenForSameText() {
        let id = UUID()
        let old = DraftSnapshot(before: "hi", after: "", documentID: id)
        XCTAssertEqual(old, DraftSnapshot(before: "hi", after: "", documentID: id))
        XCTAssertNotEqual(old, DraftSnapshot(before: "hi", after: "!", documentID: id))
        XCTAssertNotEqual(old, DraftSnapshot(before: "hi", after: "", documentID: UUID()))
    }
}
