import { useState, useEffect, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// ---------- Types ----------

interface Course {
    courseName: string
    courseCode: string
    description: string
    mainCategory: string
    shortCourse: string
    courseType: string
    pricePaise: number
    priceUsdCents: number
    mangoId: string
    refundable: boolean
}

type CountryCode = "IN" | "US"

interface CountryResponse {
    country_code: CountryCode
}

// Independent status for each request
type RequestStatus = "loading" | "success" | "error"

type SortOrder = "none" | "asc" | "desc"

interface Props {
    cardRadius: number
    cardGap: number
}

const BASE_URL = "https://syncsphere-hiv6.onrender.com"

// ---------- Type guards for malformed responses ----------

function isCourse(value: unknown): value is Course {
    if (typeof value !== "object" || value === null) return false
    const v = value as Record<string, unknown>
    return (
        typeof v.courseName === "string" &&
        typeof v.description === "string" &&
        typeof v.mainCategory === "string" &&
        typeof v.pricePaise === "number" &&
        typeof v.priceUsdCents === "number" &&
        typeof v.refundable === "boolean"
    )
}

function parseCourses(value: unknown): Course[] {
    if (!Array.isArray(value)) throw new Error("Malformed course data")
    return value.filter(isCourse)
}

function parseCountry(value: unknown): CountryCode {
    if (
        typeof value === "object" &&
        value !== null &&
        "country_code" in value
    ) {
        const code = (value as Record<string, unknown>).country_code
        if (code === "IN" || code === "US") return code
    }
    throw new Error("Malformed country data")
}

// ---------- Price formatting ----------

function formatPrice(course: Course, country: CountryCode): string {
    if (country === "IN") {
        const rupees = course.pricePaise / 100
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(rupees)
    }
    const dollars = course.priceUsdCents / 100
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(dollars)
}

// ---------- Component ----------

export default function CourseGrid(props: Props) {
    const { cardRadius, cardGap } = props

    const [courses, setCourses] = useState<Course[]>([])
    const [country, setCountry] = useState<CountryCode | null>(null)
    const [courseStatus, setCourseStatus] = useState<RequestStatus>("loading")
    const [countryStatus, setCountryStatus] = useState<RequestStatus>("loading")

    const [search, setSearch] = useState<string>("")
    const [sortOrder, setSortOrder] = useState<SortOrder>("none")

    const fetchCourses = useCallback(async () => {
        setCourseStatus("loading")
        try {
            const res = await fetch(`${BASE_URL}/assignment/course-data`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data: unknown = await res.json()
            setCourses(parseCourses(data))
            setCourseStatus("success")
        } catch (err) {
            // Retain for debugging only, never shown in UI
            console.error("Course fetch failed:", err)
            setCourseStatus("error")
        }
    }, [])

    const fetchCountry = useCallback(async () => {
        setCountryStatus("loading")
        try {
            const res = await fetch(`${BASE_URL}/assignment/country-code`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data: unknown = await res.json()
            setCountry(parseCountry(data))
            setCountryStatus("success")
        } catch (err) {
            console.error("Country fetch failed:", err)
            setCountryStatus("error")
        }
    }, [])

    useEffect(() => {
        fetchCourses()
        fetchCountry()
    }, [fetchCourses, fetchCountry])

    // ---------- Styles ----------

    const styles: Record<string, React.CSSProperties> = {
        wrapper: {
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            width: "100%",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "48px 24px",
            boxSizing: "border-box",
            color: "#1a1a2e",
        },
        intro: {
            background: "#faf8ff",
            border: "1px solid #ececf1",
            borderRadius: 16,
            padding: "20px 20px 18px",
            marginBottom: 24,
        },
        eyebrow: {
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#6c5ce7",
            lineHeight: 1.3,
        },
        introHeading: {
            margin: "8px 0 8px",
            color: "#1a1a2e",
            fontSize: "clamp(24px, 4vw, 32px)",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            fontWeight: 700,
        },
        introDescription: {
            margin: 0,
            color: "#5a5a6e",
            fontSize: "clamp(14px, 2.4vw, 16px)",
            lineHeight: 1.5,
            maxWidth: 680,
        },
        grid: {
            display: "grid",
            gap: cardGap,
            width: "100%",
        },
        card: {
            display: "flex",
            flexDirection: "column",
            border: "1px solid #ececf1",
            borderRadius: cardRadius,
            padding: 20,
            background: "#ffffff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
        },
        topRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            gap: 8,
        },
        category: {
            fontSize: 12,
            fontWeight: 600,
            color: "#6c5ce7",
            background: "#f0edff",
            padding: "4px 10px",
            borderRadius: 999,
            whiteSpace: "nowrap",
        },
        refundBadge: {
            fontSize: 11,
            fontWeight: 600,
            color: "#0a8f5b",
            background: "#e5f7ee",
            padding: "4px 8px",
            borderRadius: 999,
            whiteSpace: "nowrap",
        },
        title: {
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 8px 0",
        },
        description: {
            fontSize: 14,
            lineHeight: 1.5,
            color: "#5a5a6e",
            margin: "0 0 16px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
        },
        price: {
            fontSize: 20,
            lineHeight: "28px",
            fontWeight: 700,
            // marginTop: "auto",
        },
        pricePending: {
            fontSize: 14,
            color: "#9a9aae",
            lineHeight: "28px",
            // marginTop: "auto",
        },
        priceRow: {
            display: "flex",
            alignItems: "center",
            gap: 10,
            height: 28,
            // marginTop: "auto",
        },
        priceReloadBtn: {
            fontSize: 13,
            fontWeight: 600,
            color: "#6c5ce7",
            background: "#f0edff",
            border: "none",
            borderRadius: 8,
            padding: "6px 12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
        },
        message: {
            textAlign: "center",
            padding: "48px 24px",
            color: "#5a5a6e",
            fontSize: 15,
        },
        retryBtn: {
            marginTop: 16,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            background: "#6c5ce7",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
        },
        skeletonCard: {
            border: "1px solid #ececf1",
            borderRadius: cardRadius,
            padding: 20,
            background: "#fff",
        },
        shimmer: {
            background:
                "linear-gradient(90deg, #f0f0f5 25%, #e6e6ee 50%, #f0f0f5 75%)",
            backgroundSize: "200% 100%",
            animation: "cg-shimmer 1.4s infinite",
            borderRadius: 6,
        },
        toolbar: {
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
        },
        searchInput: {
            flex: "1 1 240px",
            minWidth: 0,
            fontSize: 14,
            padding: "10px 14px",
            border: "1px solid #ececf1",
            borderRadius: 10,
            outline: "none",
            fontFamily: "inherit",
            color: "#1a1a2e",
            boxSizing: "border-box",
        },
        sortSelect: {
            fontSize: 14,
            padding: "10px 14px",
            border: "1px solid #ececf1",
            borderRadius: 10,
            background: "#fff",
            cursor: "pointer",
            fontFamily: "inherit",
            color: "#1a1a2e",
        },
    }

    const priceMinorUnit = (course: Course): number =>
        country === "US" ? course.priceUsdCents : course.pricePaise

    const visibleCourses = (() => {
        const q = search.trim().toLowerCase()
        let list = courses
        if (q) {
            list = list.filter(
                (c) =>
                    c.courseName.toLowerCase().includes(q) ||
                    c.mainCategory.toLowerCase().includes(q) ||
                    c.description.toLowerCase().includes(q)
            )
        }
        if (sortOrder !== "none") {
            list = [...list].sort((a, b) =>
                sortOrder === "asc"
                    ? priceMinorUnit(a) - priceMinorUnit(b)
                    : priceMinorUnit(b) - priceMinorUnit(a)
            )
        }
        return list
    })()

    // ---------- Render helpers ----------

    const renderSkeletons = () => (
        <div className="cg-grid" style={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={styles.skeletonCard}>
                    <div
                        style={{
                            ...styles.shimmer,
                            height: 22.5,
                            width: "40%",
                            marginBottom: 12,
                        }}
                    />
                    <div
                        style={{
                            ...styles.shimmer,
                            height: 22,
                            width: "80%",
                            marginBottom: 8,
                        }}
                    />
                    <div
                        style={{
                            ...styles.shimmer,
                            height: 18,
                            width: "100%",
                            marginBottom: 6,
                        }}
                    />
                    <div
                        style={{
                            ...styles.shimmer,
                            height: 18,
                            width: "60%",
                            marginBottom: 16,
                        }}
                    />
                    <div
                        style={{
                            ...styles.shimmer,
                            height: 28,
                            width: "30%",
                        }}
                    />
                </div>
            ))}
        </div>
    )

    const renderPrice = (course: Course) => {
        if (countryStatus === "success" && country) {
            return (
                <div style={styles.price}>{formatPrice(course, country)}</div>
            )
        }
        if (countryStatus === "loading") {
            // return <div style={styles.pricePending}>Loading price…</div>
            return (
                <div style={{ ...styles.shimmer, height: 28, width: "30%" }} />
            )
        }
        // Country failed: show fallback + inline reload just for the country call
        return (
            <div style={styles.priceRow}>
                <span style={styles.pricePending}>Price unavailable</span>
                <button
                    style={styles.priceReloadBtn}
                    onClick={fetchCountry}
                    aria-label="Reload price"
                >
                    ↻ Reload
                </button>
            </div>
        )
    }

    const renderCards = () => {
        if (visibleCourses.length === 0) {
            return (
                <div style={styles.message}>No courses match your search.</div>
            )
        }
        return (
            <div className="cg-grid" style={styles.grid}>
                {visibleCourses.map((course) => (
                    <div
                        key={course.courseCode || course.mangoId}
                        style={styles.card}
                    >
                        <div style={styles.topRow}>
                            <span style={styles.category}>
                                {course.mainCategory}
                            </span>
                            {course.refundable && (
                                <span style={styles.refundBadge}>
                                    Refundable
                                </span>
                            )}
                        </div>
                        <h3 style={styles.title}>{course.courseName}</h3>
                        <p style={styles.description}>{course.description}</p>
                        {renderPrice(course)}
                    </div>
                ))}
            </div>
        )
    }

    // ---------- State-based rendering (driven by course request) ----------

    let body: React.ReactNode

    if (courseStatus === "loading") {
        body = (
            <>
                <div style={styles.toolbar}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search courses…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="cg-sort-select"
                        style={styles.sortSelect}
                        value={sortOrder}
                        onChange={(e) =>
                            setSortOrder(e.target.value as SortOrder)
                        }
                    >
                        <option value="none">Sort: Default</option>
                        <option value="asc">Price: Low to High</option>
                        <option value="desc">Price: High to Low</option>
                    </select>
                </div>
                {renderSkeletons()}
            </>
        )
    } else if (courseStatus === "error") {
        body = (
            <div style={styles.message}>
                <div>We couldn't load the courses. Please try again.</div>
                <button style={styles.retryBtn} onClick={fetchCourses}>
                    Retry
                </button>
            </div>
        )
    } else if (courses.length === 0) {
        body = (
            <div style={styles.message}>
                No courses available right now. Check back soon.
            </div>
        )
    } else {
        body = (
            <>
                <div style={styles.toolbar}>
                    <input
                        style={styles.searchInput}
                        type="text"
                        placeholder="Search courses…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="cg-sort-select"
                        style={styles.sortSelect}
                        value={sortOrder}
                        onChange={(e) =>
                            setSortOrder(e.target.value as SortOrder)
                        }
                    >
                        <option value="none">Sort: Default</option>
                        <option value="asc">Price: Low to High</option>
                        <option value="desc">Price: High to Low</option>
                    </select>
                </div>
                {renderCards()}
            </>
        )
    }

    return (
        <div style={styles.wrapper}>
            <style>{`
                @keyframes cg-shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .cg-sort-select {
                    width: auto;
                }
                .cg-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                }
                @media (max-width: 1024px) {
                    .cg-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                    }
                }
                @media (max-width: 767px) {
                    .cg-grid {
                        grid-template-columns: repeat(1, minmax(0, 1fr));
                    }
                }
                @media (max-width: 480px) {
                    .cg-sort-select {
                        width: 100%;
                    }
                }
            `}</style>
            <section style={styles.intro} aria-label="Courses introduction">
                <p style={styles.eyebrow}>Course Catalog</p>
                <h2 style={styles.introHeading}>
                    Learn practical skills at your pace
                </h2>
                <p style={styles.introDescription}>
                    Browse hands-on courses designed to help you build
                    real-world capability across in-demand topics.
                </p>
            </section>
            {body}
        </div>
    )
}

CourseGrid.defaultProps = {
    cardRadius: 16,
    cardGap: 24,
}

addPropertyControls(CourseGrid, {
    cardRadius: {
        type: ControlType.Number,
        title: "Card Radius",
        defaultValue: 16,
        min: 0,
        max: 40,
        step: 1,
        unit: "px",
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        defaultValue: 24,
        min: 8,
        max: 64,
        step: 2,
        unit: "px",
    },
})
