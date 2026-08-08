// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "JaipurKit",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(name: "JaipurKit", targets: ["JaipurKit"])
    ],
    targets: [
        .target(name: "JaipurKit"),
        .testTarget(name: "JaipurKitTests", dependencies: ["JaipurKit"])
    ]
)
