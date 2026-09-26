// swift-tools-version: 5.9
import PackageDescription
let package = Package(
    name: "PilotCore",
    products: [.library(name: "PilotCore", targets: ["PilotCore"])],
    targets: [.target(name: "PilotCore"), .testTarget(name: "PilotCoreTests", dependencies: ["PilotCore"])]
)
