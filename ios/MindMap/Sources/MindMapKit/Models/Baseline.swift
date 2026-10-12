import Foundation

/// A population starting point for one feature, used only until this person has
/// enough captures of their own. The confidence band carries the fact that
/// these are borrowed.
public struct FeaturePrior: Codable, Sendable, Equatable {
    public let mean: Double
    public let sd: Double
    public init(mean: Double, sd: Double) {
        self.mean = mean
        self.sd = sd
    }
}

/// Running mean and variance for one feature, kept without the history.
public struct Welford: Codable, Sendable, Equatable {
    public var n: Int = 0
    public var mean: Double = 0
    /// Sum of squares of differences from the running mean.
    public var m2: Double = 0

    public init() {}

    public init(n: Int, mean: Double, m2: Double) {
        self.n = n
        self.mean = mean
        self.m2 = m2
    }

    /// The sample standard deviation, or nil below two observations.
    public var sampleSD: Double? {
        n >= 2 ? (m2 / Double(n - 1)).squareRoot() : nil
    }
}

/// This person's own normal, built one capture at a time.
///
/// A direct port of `emptyBaseline`, `updateBaseline` and `zOf` in
/// `src/signals/score.js`. The rules that matter and are easy to lose:
///
///   * under two observations a personal mean does not exist, so the prior's
///     mean and spread are used, and with no prior the z is zero;
///   * under five observations the personal mean is used with the prior's
///     spread, because a personal sd that early is mostly noise;
///   * only one capture per day counts toward `days`; the rest still sharpen
///     the mean.
///
/// Nothing in here is fitted to a person other than the wearer, and nothing in
/// here leaves the device.
public struct Baseline: Codable, Sendable, Equatable {
    /// Total captures folded in.
    public var captures: Int = 0
    /// Distinct days folded in. This is what the fourteen-day baseline counts.
    public var days: Int = 0
    public var lastDayKey: String?
    public var stats: [String: Welford] = [:]
    /// Borrowed starting figures, by feature key. Empty for the patch route,
    /// where the repo publishes no population table and inventing one would be
    /// a fabricated number.
    public var priors: [String: FeaturePrior]

    public init(priors: [String: FeaturePrior] = [:]) {
        self.priors = priors
    }

    /// Folds one capture in and returns the updated baseline. Non-finite and
    /// missing values are skipped, exactly as the JS does.
    public func updated(with features: [String: Double], dayKey: String?) -> Baseline {
        var next = self
        for (key, value) in features {
            guard value.isFinite else { continue }
            var st = next.stats[key] ?? Welford()
            st.n += 1
            let d = value - st.mean
            st.mean += d / Double(st.n)
            st.m2 += d * (value - st.mean)
            next.stats[key] = st
        }
        next.captures += 1
        if let dayKey, dayKey != next.lastDayKey {
            next.days += 1
            next.lastDayKey = dayKey
        }
        return next
    }

    /// Mutating form, for a store that keeps one baseline.
    public mutating func update(with features: [String: Double], dayKey: String?) {
        self = updated(with: features, dayKey: dayKey)
    }

    /// How far one value sits from this person's normal, in standard
    /// deviations. Unclamped: the caller clamps, because the clamp limit
    /// belongs to the network.
    public func z(_ key: String, _ value: Double) -> Double {
        let prior = priors[key]
        guard let st = stats[key], st.n >= 2 else {
            guard let prior, prior.sd > 0 else { return 0 }
            return (value - prior.mean) / prior.sd
        }
        let sd: Double
        if st.n >= 5 {
            sd = (st.m2 / Double(st.n - 1)).squareRoot()
        } else if let prior {
            sd = prior.sd
        } else {
            sd = 1
        }
        guard sd > 0 else { return 0 }
        return (value - st.mean) / sd
    }

    /// A day key in the device's own time zone, which is what decides whether
    /// a capture is a new day for this person.
    public static func dayKey(for date: Date, calendar: Calendar = .current) -> String {
        let c = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", c.year ?? 0, c.month ?? 0, c.day ?? 0)
    }

    /// Population figures for the camera and microphone route, copied from
    /// `PRIOR` in `src/signals/score.js`. Deliberately wide. The variation
    /// figure is the camera index, not clinical RMSSD.
    public static let phoneCapturePriors: [String: FeaturePrior] = [
        "hr":        FeaturePrior(mean: 76,    sd: 11),
        "hrv":       FeaturePrior(mean: 26,    sd: 11),
        "f0Mean":    FeaturePrior(mean: 175,   sd: 38),
        "f0Cv":      FeaturePrior(mean: 0.22,  sd: 0.08),
        "f0Instab":  FeaturePrior(mean: 0.025, sd: 0.012),
        "ampInstab": FeaturePrior(mean: 0.13,  sd: 0.05),
    ]
}
