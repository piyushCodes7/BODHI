/**
 * BODHI — Mission-Based Travel Booking App
 * TravelBookingScreen.tsx  v2.0
 *
 * What's new in v2:
 *  - TextInput city search with floating FlatList overlay
 *  - API-ready fetchFlightData() — swap setTimeout for real fetch() later
 *  - Confirm Selection CTA only activates after a flight is tapped
 *  - Proper Amadeus-style Flight interface
 *  - Full modular sub-components
 *
 * Requires: react-native-linear-gradient, lucide-react-native, @react-navigation/native
 */

import React, {
    useState,
    useRef,
    useCallback,
    useEffect,
    memo,
    useMemo,
} from 'react';
import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
    StatusBar,
    SafeAreaView,
    Platform,
    ActivityIndicator,
    Keyboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
    Bell,
    ChevronLeft,
    Lock,
    Plane,
    Calendar,
    Zap,
    Brain,
    TrendingDown,
    Star,
    Filter,
    Shield,
    Clock,
    Search,
    ArrowRight,
    CheckCircle,
    X,
    RefreshCw,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME = {
    bg: {
        primary: '#05050A',
        secondary: '#12121A',
        card: 'rgba(255,255,255,0.04)',
        overlay: 'rgba(10,10,18,0.97)',
    },
    accent: {
        lime: '#D4FF00',
        purple: '#A855F7',
        purpleDark: '#7C3AED',
        limeDim: 'rgba(212,255,0,0.12)',
        purpleDim: 'rgba(168,85,247,0.12)',
        limeGrad: ['#D4FF00', '#a8cc00'] as [string, string],
        purpleGrad: ['#A855F7', '#7C3AED'] as [string, string],
    },
    border: {
        default: 'rgba(255,255,255,0.09)',
        focus: 'rgba(212,255,0,0.4)',
        lime: 'rgba(212,255,0,0.25)',
        purple: 'rgba(168,85,247,0.25)',
    },
    text: {
        primary: '#FFFFFF',
        secondary: 'rgba(255,255,255,0.55)',
        muted: 'rgba(255,255,255,0.30)',
        placeholder: 'rgba(255,255,255,0.25)',
    },
    danger: 'rgba(255,80,80,0.8)',
} as const;

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────
type TripMode = 'solo' | 'squad';
type TabKey = 'contributors' | 'strategy' | 'timeline';

/** Amadeus/Skyscanner-compatible Flight interface */
interface FlightSegment {
    departure: {
        iataCode: string;       // e.g. "DEL"
        cityName: string;       // e.g. "New Delhi"
        terminal?: string;
        at: string;             // ISO 8601 — "2025-05-24T06:20:00"
    };
    arrival: {
        iataCode: string;
        cityName: string;
        terminal?: string;
        at: string;             // ISO 8601 — "2025-05-24T08:35:00"
    };
    carrierCode: string;        // "6E"
    number: string;             // "201"
    duration: string;           // "PT2H15M" (ISO 8601 duration)
    numberOfStops: number;
}

interface FlightOffer {
    id: string;
    /** Human-readable label for display */
    airlineName: string;
    /** e.g. "6E-201" */
    flightCode: string;
    segments: FlightSegment[];
    price: {
        total: string;          // "3899.00"
        currency: string;       // "INR"
        perAdult: string;
        label: string;          // "per person" | "flight + hotel"
    };
    rating: number;
    insight?: string;
    insightType: 'lime' | 'purple';
    /** Gradient bg for the card banner */
    imageBg: [string, string, string];
    validatingAirlineCodes: string[];
    numberOfBookableSeats: number;
}

interface CityOption {
    name: string;
    code: string;               // IATA
    country: string;
    flag: string;               // emoji flag
}

interface Contributor {
    id: string;
    initials: string;
    name: string;
    amount: number;
    status: 'paid' | 'pending';
    avatarGradient: [string, string];
    isYou?: boolean;
}

// ─── Mock City Database ───────────────────────────────────────────────────────
// TODO: Replace with fetch() to a Places / Amadeus Airport Search API
const CITY_DATABASE: CityOption[] = [
    { name: 'New Delhi', code: 'DEL', country: 'India', flag: '🇮🇳' },
    { name: 'Mumbai', code: 'BOM', country: 'India', flag: '🇮🇳' },
    { name: 'Bangalore', code: 'BLR', country: 'India', flag: '🇮🇳' },
    { name: 'Chennai', code: 'MAA', country: 'India', flag: '🇮🇳' },
    { name: 'Hyderabad', code: 'HYD', country: 'India', flag: '🇮🇳' },
    { name: 'Kolkata', code: 'CCU', country: 'India', flag: '🇮🇳' },
    { name: 'Pune', code: 'PNQ', country: 'India', flag: '🇮🇳' },
    { name: 'Ahmedabad', code: 'AMD', country: 'India', flag: '🇮🇳' },
    { name: 'Jaipur', code: 'JAI', country: 'India', flag: '🇮🇳' },
    { name: 'Goa', code: 'GOI', country: 'India', flag: '🇮🇳' },
    { name: 'London Heathrow', code: 'LHR', country: 'UK', flag: '🇬🇧' },
    { name: 'London Gatwick', code: 'LGW', country: 'UK', flag: '🇬🇧' },
    { name: 'Dubai', code: 'DXB', country: 'UAE', flag: '🇦🇪' },
    { name: 'Singapore', code: 'SIN', country: 'Singapore', flag: '🇸🇬' },
    { name: 'Bangkok', code: 'BKK', country: 'Thailand', flag: '🇹🇭' },
    { name: 'Tokyo Narita', code: 'NRT', country: 'Japan', flag: '🇯🇵' },
    { name: 'New York JFK', code: 'JFK', country: 'USA', flag: '🇺🇸' },
    { name: 'Paris CDG', code: 'CDG', country: 'France', flag: '🇫🇷' },
    { name: 'Frankfurt', code: 'FRA', country: 'Germany', flag: '🇩🇪' },
    { name: 'Amsterdam', code: 'AMS', country: 'Netherlands', flag: '🇳🇱' },
];

// ─── Mock Flight Pool ─────────────────────────────────────────────────────────
const MOCK_FLIGHT_POOL: Omit<FlightOffer, 'segments'>[] = [
    {
        id: 'f1',
        airlineName: 'IndiGo',
        flightCode: '6E-201',
        price: { total: '3899.00', currency: 'INR', perAdult: '3899.00', label: 'per person' },
        rating: 4.2,
        insight: '💡 Cheapest price in 3 months',
        insightType: 'lime',
        imageBg: ['#1a0533', '#0d1533', '#001a33'],
        validatingAirlineCodes: ['6E'],
        numberOfBookableSeats: 9,
    },
    {
        id: 'f2',
        airlineName: 'Air India',
        flightCode: 'AI-677',
        price: { total: '8499.00', currency: 'INR', perAdult: '5200.00', label: 'flight + hotel' },
        rating: 4.8,
        insight: '⚡ Squad deal: 6 seats available',
        insightType: 'purple',
        imageBg: ['#001a0d', '#0a2200', '#1a3300'],
        validatingAirlineCodes: ['AI'],
        numberOfBookableSeats: 6,
    },
    {
        id: 'f3',
        airlineName: 'Vistara',
        flightCode: 'UK-895',
        price: { total: '5299.00', currency: 'INR', perAdult: '5299.00', label: 'per person' },
        rating: 4.5,
        insight: '📈 Price rising tomorrow',
        insightType: 'purple',
        imageBg: ['#1a0d00', '#331500', '#1a0a00'],
        validatingAirlineCodes: ['UK'],
        numberOfBookableSeats: 12,
    },
];

/** Build ISO 8601-style segments from origin/destination for mock data */
function buildMockSegment(origin: CityOption, dest: CityOption, date: string): FlightSegment {
    return {
        departure: { iataCode: origin.code, cityName: origin.name, at: `${date}T06:20:00` },
        arrival: { iataCode: dest.code, cityName: dest.name, at: `${date}T08:35:00` },
        carrierCode: 'XX',
        number: '000',
        duration: 'PT2H15M',
        numberOfStops: 0,
    };
}

/** Parse ISO 8601 duration "PT2H15M" → "2h 15m" */
function parseDuration(iso: string): string {
    const h = iso.match(/(\d+)H/)?.[1];
    const m = iso.match(/(\d+)M/)?.[1];
    return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ');
}

/** Format ISO datetime → "06:20 AM" */
function formatTime(iso: string): string {
    try {
        return new Date(iso).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return iso.split('T')[1]?.slice(0, 5) ?? '--:--';
    }
}

// ─── API Layer ────────────────────────────────────────────────────────────────
/**
 * fetchFlightData — currently mocked with setTimeout.
 *
 * To connect a real API, replace the body with:
 *
 *   const token = await getAmadeusToken(apiKey, apiSecret);
 *   const res = await fetch(
 *     `https://api.amadeus.com/v2/shopping/flight-offers` +
 *     `?originLocationCode=${origin.code}` +
 *     `&destinationLocationCode=${destination.code}` +
 *     `&departureDate=${date}&adults=1&max=10`,
 *     { headers: { Authorization: `Bearer ${token}` } }
 *   );
 *   const json = await res.json();
 *   return json.data as FlightOffer[];
 */
async function fetchFlightData(
    origin: CityOption,
    destination: CityOption,
    date: string,
    _apiKey?: string,       // reserved — pass your Amadeus key here
): Promise<FlightOffer[]> {
    // Simulate network latency (1.8 s)
    await new Promise((resolve) => setTimeout(resolve, 1800));

    return MOCK_FLIGHT_POOL.map((base) => ({
        ...base,
        id: `${base.id}-${origin.code}-${destination.code}`,
        segments: [buildMockSegment(origin, destination, date)],
    }));
}

// ─── Squad mock data ──────────────────────────────────────────────────────────
const CONTRIBUTORS: Contributor[] = [
    { id: '1', initials: 'RK', name: 'Raj Kumar', amount: 10000, status: 'paid', avatarGradient: ['#A855F7', '#7C3AED'], isYou: true },
    { id: '2', initials: 'SJ', name: 'Sara Joshi', amount: 8000, status: 'paid', avatarGradient: ['#D4FF00', '#a8cc00'] },
    { id: '3', initials: 'PM', name: 'Priya M', amount: 7000, status: 'paid', avatarGradient: ['#f97316', '#ea580c'] },
    { id: '4', initials: 'NK', name: 'Nikhil K', amount: 5000, status: 'pending', avatarGradient: ['#06b6d4', '#0284c7'] },
];
const WALLET_GOAL = 50000;

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = memo<{
    initials: string;
    gradient: [string, string];
    size?: number;
    style?: object;
}>(({ initials, gradient, size = 36, style }) => (
    <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }, style]}
    >
        <Text style={[styles.avatarText, { fontSize: size * 0.33 }]}>{initials}</Text>
    </LinearGradient>
));

// ─── Mode Toggle ──────────────────────────────────────────────────────────────
const ModeToggle = memo<{ mode: TripMode; onToggle: (m: TripMode) => void }>(
    ({ mode, onToggle }) => {
        const MODES: { key: TripMode; label: string }[] = [
            { key: 'solo', label: '⚡ SOLO' },
            { key: 'squad', label: '👥 SQUAD' },
        ];
        return (
            <View style={styles.toggleWrap}>
                {MODES.map(({ key, label }) => {
                    const active = mode === key;
                    const gradColors = key === 'solo' ? THEME.accent.limeGrad : THEME.accent.purpleGrad;
                    const color = active ? (key === 'solo' ? THEME.bg.primary : THEME.text.primary) : THEME.text.muted;
                    if (active) {
                        return (
                            <LinearGradient key={key} colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.toggleBtnGrad}>
                                <TouchableOpacity style={styles.toggleBtnInner} onPress={() => onToggle(key)} activeOpacity={0.9}>
                                    <Text style={[styles.toggleText, { color }]}>{label}</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        );
                    }
                    return (
                        <TouchableOpacity key={key} style={[styles.toggleBtnInner, styles.toggleBtnInactive]} onPress={() => onToggle(key)} activeOpacity={0.7}>
                            <Text style={[styles.toggleText, { color: THEME.text.muted }]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    },
);

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
const SkeletonCard = memo(() => {
    const opacity = useRef(new Animated.Value(0.3)).current;
    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, { toValue: 0.75, duration: 750, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0.3, duration: 750, useNativeDriver: true }),
            ]),
        );
        anim.start();
        return () => anim.stop();
    }, [opacity]);
    return (
        <Animated.View style={[styles.flightCard, { borderColor: THEME.border.default, opacity }]}>
            <View style={[styles.flightImageBg, { backgroundColor: 'rgba(255,255,255,0.04)' }]} />
            <View style={styles.flightBody}>
                <View style={styles.flightRouteRow}>
                    <View style={styles.skeletonCode} />
                    <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.07)', marginHorizontal: 12 }} />
                    <View style={styles.skeletonCode} />
                </View>
                <View style={[styles.skeletonLine, { width: '55%' }]} />
                <View style={[styles.skeletonLine, { width: '35%', marginTop: 5 }]} />
            </View>
        </Animated.View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOCATION INPUT
// ═══════════════════════════════════════════════════════════════════════════════
interface LocationInputProps {
    label: 'FROM' | 'TO';
    value: CityOption | null;
    onSelect: (city: CityOption) => void;
    align?: 'left' | 'right';
}

const LocationInput = memo<LocationInputProps>(({ label, value, onSelect, align = 'left' }) => {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<TextInput>(null);

    /**
     * Suggestion filter — swap with API call:
     *   const res = await fetch(`https://api.example.com/airports?q=${query}`);
     *   const suggestions = await res.json();
     */
    const suggestions = useMemo<CityOption[]>(() => {
        if (query.trim().length < 1) return [];
        const lower = query.toLowerCase();
        return CITY_DATABASE.filter(
            (c) =>
                c.name.toLowerCase().includes(lower) ||
                c.code.toLowerCase().includes(lower) ||
                c.country.toLowerCase().includes(lower),
        ).slice(0, 6);
    }, [query]);

    const handleSelect = useCallback((city: CityOption) => {
        onSelect(city);
        setQuery('');
        setFocused(false);
        Keyboard.dismiss();
    }, [onSelect]);

    const handleClear = useCallback(() => {
        setQuery('');
        inputRef.current?.focus();
    }, []);

    const borderColor = focused ? THEME.border.focus : THEME.border.default;
    const isRight = align === 'right';

    return (
        <View style={[styles.locationInputWrap, isRight && styles.locationInputRight]}>
            <View style={[styles.routeField, { borderColor }]}>
                <Text style={styles.routeFieldLabel}>{label}</Text>

                {focused ? (
                    <View style={styles.inputRow}>
                        <TextInput
                            ref={inputRef}
                            style={[styles.cityTextInput, isRight && styles.alignRight]}
                            value={query}
                            onChangeText={setQuery}
                            placeholder={value?.code ?? 'Search…'}
                            placeholderTextColor={THEME.text.placeholder}
                            autoFocus
                            autoCorrect={false}
                            autoCapitalize="characters"
                            returnKeyType="search"
                            onBlur={() => {
                                // Delay so tap-on-suggestion fires first
                                setTimeout(() => {
                                    setFocused(false);
                                    setQuery('');
                                }, 160);
                            }}
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <X size={12} color={THEME.text.muted} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <TouchableOpacity onPress={() => setFocused(true)} activeOpacity={0.8}>
                        <Text style={[styles.routeCode, !value && { color: THEME.text.muted, fontSize: 16 }]}>
                            {value?.code ?? 'TAP'}
                        </Text>
                        <Text style={[styles.routeCity, isRight && styles.alignRight]} numberOfLines={1}>
                            {value ? `${value.name}, ${value.country}` : 'Select city'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Floating suggestion overlay */}
            {focused && suggestions.length > 0 && (
                <View style={[styles.suggestionsList, isRight && styles.suggestionsRight]}>
                    {suggestions.map((city, idx) => (
                        <TouchableOpacity
                            key={city.code}
                            style={[
                                styles.suggestionRow,
                                idx < suggestions.length - 1 && styles.suggestionBorder,
                            ]}
                            onPress={() => handleSelect(city)}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.suggestionFlag}>{city.flag}</Text>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.suggestionName}>{city.name}</Text>
                                <Text style={styles.suggestionCountry}>{city.country}</Text>
                            </View>
                            <Text style={styles.suggestionCode}>{city.code}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MISSION INPUT CARD
// ═══════════════════════════════════════════════════════════════════════════════
interface MissionInputCardProps {
    origin: CityOption | null;
    destination: CityOption | null;
    onOriginSelect: (c: CityOption) => void;
    onDestinationSelect: (c: CityOption) => void;
    onSearch: () => void;
    isLoading: boolean;
}

const MissionInputCard = memo<MissionInputCardProps>(
    ({ origin, destination, onOriginSelect, onDestinationSelect, onSearch, isLoading }) => {
        const rotateAnim = useRef(new Animated.Value(0)).current;
        const searchScaleAnim = useRef(new Animated.Value(1)).current;
        const canSearch = !!origin && !!destination && origin.code !== destination.code;

        const handleSwap = useCallback(() => {
            Animated.sequence([
                Animated.timing(rotateAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ]).start();
            if (origin && destination) {
                onOriginSelect(destination);
                onDestinationSelect(origin);
            }
        }, [rotateAnim, origin, destination, onOriginSelect, onDestinationSelect]);

        const handleSearchPress = useCallback(() => {
            if (!canSearch || isLoading) return;
            Animated.sequence([
                Animated.timing(searchScaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
                Animated.spring(searchScaleAnim, { toValue: 1, useNativeDriver: true }),
            ]).start(onSearch);
        }, [canSearch, isLoading, searchScaleAnim, onSearch]);

        const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

        return (
            <View style={[styles.glassCard, { zIndex: 20 }]}>
                <Text style={styles.sectionLabel}>Mission Target</Text>

                {/* Route */}
                <View style={styles.routeRow}>
                    <LocationInput label="FROM" value={origin} onSelect={onOriginSelect} align="left" />
                    <TouchableOpacity onPress={handleSwap} activeOpacity={0.8} style={{ marginTop: 10 }}>
                        <LinearGradient
                            colors={canSearch ? THEME.accent.limeGrad : ['#2a2a30', '#1a1a20']}
                            style={styles.swapBtn}
                        >
                            <Animated.View style={{ transform: [{ rotate }] }}>
                                <RefreshCw size={13} color={canSearch ? THEME.bg.primary : THEME.text.muted} strokeWidth={2.5} />
                            </Animated.View>
                        </LinearGradient>
                    </TouchableOpacity>
                    <LocationInput label="TO" value={destination} onSelect={onDestinationSelect} align="right" />
                </View>

                {/* Dates */}
                <View style={styles.dateRow}>
                    {[{ label: 'Depart', val: 'May 24, 2025' }, { label: 'Return', val: 'May 28, 2025' }].map((d) => (
                        <TouchableOpacity key={d.label} style={styles.dateField} activeOpacity={0.7}>
                            <Calendar size={12} color={THEME.accent.purple} strokeWidth={2} />
                            <View style={{ marginLeft: 6 }}>
                                <Text style={styles.dateLabel}>{d.label}</Text>
                                <Text style={styles.dateVal}>{d.val}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Search CTA */}
                <Animated.View style={{ marginTop: 12, transform: [{ scale: searchScaleAnim }] }}>
                    <TouchableOpacity
                        onPress={handleSearchPress}
                        activeOpacity={canSearch ? 0.9 : 1}
                        disabled={!canSearch || isLoading}
                    >
                        <LinearGradient
                            colors={canSearch ? THEME.accent.limeGrad : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.searchBtn}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color={THEME.bg.primary} />
                            ) : (
                                <Search size={14} color={canSearch ? THEME.bg.primary : THEME.text.muted} strokeWidth={2.5} />
                            )}
                            <Text style={[styles.searchBtnText, !canSearch && { color: THEME.text.muted }]}>
                                {isLoading
                                    ? 'SCANNING AIRSPACE…'
                                    : canSearch
                                        ? 'SCAN AIRSPACE'
                                        : 'SELECT BOTH CITIES FIRST'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        );
    },
);

// ═══════════════════════════════════════════════════════════════════════════════
// FLIGHT CARD
// ═══════════════════════════════════════════════════════════════════════════════
interface FlightCardProps {
    item: FlightOffer;
    selected: boolean;
    onSelect: (id: string) => void;
}

const FlightCard = memo<FlightCardProps>(({ item, selected, onSelect }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const seg = item.segments[0];

    const handlePress = useCallback(() => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 6 }),
        ]).start(() => onSelect(item.id));
    }, [scaleAnim, onSelect, item.id]);

    const isLime = item.insightType === 'lime';
    const accentColor = isLime ? THEME.accent.lime : THEME.accent.purple;
    const insightBg = isLime ? 'rgba(212,255,0,0.88)' : 'rgba(168,85,247,0.88)';
    const insightTextColor = isLime ? THEME.bg.primary : THEME.text.primary;
    const borderColor = selected ? accentColor : THEME.border.default;
    const stopsLabel = seg.numberOfStops === 0 ? 'Non-stop' : `${seg.numberOfStops} Stop${seg.numberOfStops > 1 ? 's' : ''}`;
    const duration = parseDuration(seg.duration);
    const departTime = formatTime(seg.departure.at);
    const arrivalTime = formatTime(seg.arrival.at);

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={1}
                style={[styles.flightCard, { borderColor, borderWidth: selected ? 1.5 : 1 }]}
            >
                {/* Banner */}
                <LinearGradient colors={item.imageBg} style={styles.flightImageBg}>
                    <Plane size={52} color="rgba(255,255,255,0.06)" strokeWidth={1} />
                    <Text style={styles.flightCityWatermark}>{seg.arrival.iataCode}</Text>
                    {item.insight && (
                        <View style={[styles.insightTag, { backgroundColor: insightBg }]}>
                            <Text style={[styles.insightText, { color: insightTextColor }]}>{item.insight}</Text>
                        </View>
                    )}
                    {selected && (
                        <View style={[styles.selectedBadge, { backgroundColor: accentColor }]}>
                            <CheckCircle size={9} color={isLime ? THEME.bg.primary : THEME.text.primary} strokeWidth={2.5} />
                            <Text style={[styles.selectedBadgeText, { color: isLime ? THEME.bg.primary : THEME.text.primary }]}>
                                SELECTED
                            </Text>
                        </View>
                    )}
                </LinearGradient>

                {/* Body */}
                <View style={styles.flightBody}>
                    <View style={styles.flightRouteRow}>
                        <View>
                            <Text style={styles.cityCode}>{seg.departure.iataCode}</Text>
                            <Text style={styles.timeLabel}>{departTime}</Text>
                        </View>
                        <View style={styles.flightLineWrap}>
                            <View style={styles.flightLine} />
                            <View style={styles.flightDurationChip}>
                                <Clock size={8} color={THEME.text.muted} strokeWidth={2} />
                                <Text style={styles.flightDuration}>{duration} · {stopsLabel}</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.cityCode}>{seg.arrival.iataCode}</Text>
                            <Text style={styles.timeLabel}>{arrivalTime}</Text>
                        </View>
                    </View>

                    <View style={styles.flightBottomRow}>
                        <View>
                            <Text style={styles.airlineName}>{item.airlineName} · {item.flightCode}</Text>
                            <View style={styles.ratingRow}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} size={10}
                                        color={i < Math.floor(item.rating) ? THEME.accent.lime : THEME.text.muted}
                                        fill={i < Math.floor(item.rating) ? THEME.accent.lime : 'transparent'}
                                        strokeWidth={1.5}
                                    />
                                ))}
                                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                            </View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.flightPrice, { color: accentColor }]}>
                                ₹{parseInt(item.price.total, 10).toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.flightPriceSub}>{item.price.label}</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// SQUAD WALLET
// ═══════════════════════════════════════════════════════════════════════════════
const ContributorRow = memo<{ item: Contributor; goal: number }>(({ item, goal }) => {
    const fraction = item.amount / goal;
    const barColor = item.status === 'pending' ? THEME.danger : item.isYou ? THEME.accent.lime : THEME.accent.purple;
    return (
        <View style={styles.contributorRow}>
            <Avatar initials={item.initials} gradient={item.avatarGradient} size={26} />
            <Text style={styles.contributorName} numberOfLines={1}>
                {item.name}
                {item.isYou && <Text style={{ color: THEME.accent.lime }}> • you</Text>}
                {item.status === 'pending' && <Text style={{ color: THEME.danger }}> • pending</Text>}
            </Text>
            <View style={styles.miniBarBg}>
                <View style={[styles.miniBarFill, { width: `${Math.min(fraction * 100, 100)}%` as any, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.contributorAmount, { color: barColor }]}>
                ₹{item.amount.toLocaleString('en-IN')}
            </Text>
        </View>
    );
});

const SquadWallet = memo(() => {
    const [activeTab, setActiveTab] = useState<TabKey>('contributors');
    const collected = CONTRIBUTORS.filter((c) => c.status === 'paid').reduce((a, c) => a + c.amount, 0);
    const percent = Math.round((collected / WALLET_GOAL) * 100);

    const TABS: { key: TabKey; label: string }[] = [
        { key: 'contributors', label: 'Contributors' },
        { key: 'strategy', label: 'Strategy' },
        { key: 'timeline', label: 'Timeline' },
    ];

    return (
        <View style={styles.walletCard}>
            <View style={styles.walletHeader}>
                <View style={styles.walletTitleRow}>
                    <Lock size={13} color={THEME.accent.purple} strokeWidth={2.5} />
                    <Text style={styles.walletTitle}>SELF-DESTRUCT WALLET</Text>
                </View>
                <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>ACTIVE</Text></View>
            </View>

            <View style={styles.avatarStack}>
                {CONTRIBUTORS.map((c, i) => (
                    <Avatar key={c.id} initials={c.initials} gradient={c.avatarGradient} size={34}
                        style={{ marginLeft: i === 0 ? 0 : -9, zIndex: CONTRIBUTORS.length - i }} />
                ))}
                <View style={styles.avatarMoreChip}><Text style={styles.avatarMoreText}>+2</Text></View>
                <View style={{ marginLeft: 10 }}>
                    <Text style={styles.poolingLabel}>POOLING WITH</Text>
                    <Text style={styles.poolingNames}>Raj, Sara, Priya +3</Text>
                </View>
            </View>

            <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 }}>
                    <Text style={styles.collectedText}>₹{collected.toLocaleString('en-IN')}</Text>
                    <Text style={[styles.goalText, { marginTop: 6 }]}>Goal: ₹{WALLET_GOAL.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.progressBarBg}>
                    <LinearGradient colors={[THEME.accent.purple, THEME.accent.lime]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${percent}%` as any }]} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                    <Text style={styles.progressMetaLeft}>{percent}% collected</Text>
                    <Text style={styles.progressMetaRight}>₹{(WALLET_GOAL - collected).toLocaleString('en-IN')} pending</Text>
                </View>
            </View>

            <View style={styles.tabRow}>
                {TABS.map((t) => (
                    <TouchableOpacity key={t.key} style={[styles.tab, activeTab === t.key && styles.tabActive]}
                        onPress={() => setActiveTab(t.key)} activeOpacity={0.7}>
                        <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'contributors' && (
                <View>{CONTRIBUTORS.map((c) => <ContributorRow key={c.id} item={c} goal={WALLET_GOAL} />)}</View>
            )}
            {activeTab === 'strategy' && (
                <View style={{ gap: 10 }}>
                    {[
                        { icon: <Shield size={13} color={THEME.accent.lime} />, text: 'Auto-refund if trip cancelled 7+ days prior' },
                        { icon: <Zap size={13} color={THEME.accent.purple} />, text: 'Wallet self-destructs on May 29 if unused' },
                        { icon: <Brain size={13} color={THEME.accent.lime} />, text: 'BODHI earns 4.2% yield on idle pool funds' },
                        { icon: <TrendingDown size={13} color={THEME.accent.purple} />, text: 'Auto-books cheapest fare once goal is met' },
                    ].map((item, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                            {item.icon}
                            <Text style={{ fontSize: 11, color: THEME.text.secondary, flex: 1 }}>{item.text}</Text>
                        </View>
                    ))}
                </View>
            )}
            {activeTab === 'timeline' && (
                <View>
                    {[
                        { icon: '✅', label: 'Wallet created', date: 'May 10' },
                        { icon: '⏳', label: 'Goal deadline', date: 'May 20' },
                        { icon: '🔒', label: 'Auto-lock booking', date: 'May 21' },
                        { icon: '✈️', label: 'Travel day', date: 'May 24' },
                        { icon: '💸', label: 'Wallet destructs', date: 'May 29' },
                    ].map((t) => (
                        <View key={t.date} style={{ flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                            <Text style={{ fontSize: 13 }}>{t.icon}</Text>
                            <Text style={{ flex: 1, fontSize: 11, color: THEME.text.secondary }}>{t.label}</Text>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: THEME.text.muted }}>{t.date}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.bodhiBrain}>
                <View style={styles.brainPulse} />
                <Brain size={12} color={THEME.accent.lime} />
                <Text style={styles.brainText}>BODHI Brain: {percent}% Liquid — Ready to Book</Text>
            </View>
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIRM SELECTION BUTTON
// ═══════════════════════════════════════════════════════════════════════════════
interface ConfirmButtonProps {
    mode: TripMode;
    selectedFlight: FlightOffer | null;
    onConfirm: () => void;
}

const ConfirmSelectionButton = memo<ConfirmButtonProps>(({ mode, selectedFlight, onConfirm }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const [processing, setProcessing] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    // Reset on new selection
    useEffect(() => { setConfirmed(false); }, [selectedFlight?.id]);

    const handlePress = useCallback(() => {
        if (!selectedFlight || processing || confirmed) return;
        setProcessing(true);
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
        ]).start();
        setTimeout(() => {
            setProcessing(false);
            setConfirmed(true);
            onConfirm();
            setTimeout(() => setConfirmed(false), 3000);
        }, 1200);
    }, [selectedFlight, processing, confirmed, scaleAnim, onConfirm]);

    const isReady = !!selectedFlight && !processing && !confirmed;
    const gradColors: [string, string] = confirmed
        ? THEME.accent.limeGrad
        : isReady
            ? THEME.accent.purpleGrad
            : ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.04)'];

    const ctaLabel = confirmed
        ? '🚀  BOOKING CONFIRMED!'
        : processing
            ? 'PROCESSING…'
            : mode === 'squad'
                ? 'COMMIT TO SQUAD POOL'
                : 'PROCEED TO PAYMENT';

    const subLabel = confirmed
        ? 'Get ready for your mission'
        : selectedFlight
            ? `${selectedFlight.airlineName} · ₹${parseInt(selectedFlight.price.total, 10).toLocaleString('en-IN')}`
            : 'Select a flight above to continue';

    const textColor = confirmed ? THEME.bg.primary : isReady ? THEME.text.primary : THEME.text.muted;
    const subColor = confirmed ? 'rgba(5,5,10,0.6)' : isReady ? THEME.text.secondary : THEME.text.muted;

    return (
        <Animated.View style={[styles.ctaWrap, { transform: [{ scale: scaleAnim }] }]}>
            <TouchableOpacity onPress={handlePress} activeOpacity={isReady ? 0.9 : 1} disabled={!isReady}>
                <LinearGradient colors={gradColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.lockBtn}>
                    <View style={styles.lockBtnInner}>
                        {processing ? (
                            <ActivityIndicator color={THEME.text.primary} size="small" />
                        ) : confirmed ? (
                            <Text style={{ fontSize: 20 }}>🚀</Text>
                        ) : isReady ? (
                            <ArrowRight size={20} color={THEME.text.primary} strokeWidth={2.5} />
                        ) : (
                            <Lock size={20} color={THEME.text.muted} strokeWidth={2} />
                        )}
                        <View>
                            <Text style={[styles.lockBtnText, { color: textColor }]}>{ctaLabel}</Text>
                            <Text style={[styles.lockBtnSub, { color: subColor }]}>{subLabel}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCREEN
// ═══════════════════════════════════════════════════════════════════════════════
const TravelBookingScreen: React.FC = () => {
    const navigation = useNavigation();

    const [mode, setMode] = useState<TripMode>('solo');
    const [origin, setOrigin] = useState<CityOption | null>(null);
    const [destination, setDestination] = useState<CityOption | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [flights, setFlights] = useState<FlightOffer[]>([]);
    const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const selectedFlight = useMemo(
        () => flights.find((f) => f.id === selectedFlightId) ?? null,
        [flights, selectedFlightId],
    );

    const handleSearch = useCallback(async () => {
        if (!origin || !destination) return;
        Keyboard.dismiss();
        setIsLoading(true);
        setFlights([]);
        setSelectedFlightId(null);
        setHasSearched(true);
        try {
            const results = await fetchFlightData(origin, destination, '2025-05-24');
            setFlights(results);
        } catch (err) {
            console.error('Flight fetch failed:', err);
            // TODO: set error state and show user-facing message
        } finally {
            setIsLoading(false);
        }
    }, [origin, destination]);

    const handleFlightSelect = useCallback((id: string) => {
        setSelectedFlightId((prev) => (prev === id ? null : id));
    }, []);

    const handleConfirm = useCallback(() => {
        // TODO: navigate to PaymentScreen or SquadPoolScreen
        console.log('User confirmed flight:', selectedFlightId);
    }, [selectedFlightId]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={THEME.bg.primary} />

            {/* ── Header ── */}
            <LinearGradient
                colors={['#1a0533', '#0d0d1a', '#12180a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerTop}>
                    <TouchableOpacity style={styles.headerIconBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <ChevronLeft size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>MISSION PLANNER</Text>
                    <TouchableOpacity style={[styles.headerIconBtn, styles.notifBtn]} activeOpacity={0.7}>
                        <Bell size={15} color={THEME.accent.purple} strokeWidth={2} />
                        <View style={styles.notifDot} />
                    </TouchableOpacity>
                </View>
                <ModeToggle mode={mode} onToggle={setMode} />
            </LinearGradient>

            {/* ── Body ── */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <MissionInputCard
                        origin={origin}
                        destination={destination}
                        onOriginSelect={setOrigin}
                        onDestinationSelect={setDestination}
                        onSearch={handleSearch}
                        isLoading={isLoading}
                    />

                    {mode === 'squad' && <SquadWallet />}

                    {/* Results */}
                    {(isLoading || hasSearched) && (
                        <View style={styles.resultsHeader}>
                            <Text style={styles.resultsTitle}>
                                {isLoading ? 'Scanning Airspace…' : `Smart Results (${flights.length})`}
                            </Text>
                            {!isLoading && flights.length > 0 && (
                                <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
                                    <Filter size={12} color={THEME.accent.purple} strokeWidth={2} />
                                    <Text style={styles.filterText}>Filter</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}

                    {isLoading && <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>}

                    {!isLoading && flights.map((f) => (
                        <FlightCard
                            key={f.id}
                            item={f}
                            selected={f.id === selectedFlightId}
                            onSelect={handleFlightSelect}
                        />
                    ))}

                    {!isLoading && hasSearched && flights.length === 0 && (
                        <View style={styles.emptyState}>
                            <Plane size={32} color={THEME.text.muted} />
                            <Text style={styles.emptyStateText}>No flights found</Text>
                            <Text style={styles.emptyStateSub}>Try different dates or destinations</Text>
                        </View>
                    )}

                    <View style={{ height: 24 }} />
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Confirm CTA ── */}
            <ConfirmSelectionButton
                mode={mode}
                selectedFlight={selectedFlight}
                onConfirm={handleConfirm}
            />
        </SafeAreaView>
    );
};

export default TravelBookingScreen;

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: THEME.bg.primary },
    scroll: { flex: 1, backgroundColor: THEME.bg.primary },
    scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

    // Header
    header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    headerTitle: { fontSize: 14, fontWeight: '800', color: THEME.text.primary, letterSpacing: 2 },
    headerIconBtn: { width: 34, height: 34, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border.default },
    notifBtn: { backgroundColor: 'rgba(168,85,247,0.12)', borderColor: THEME.border.purple },
    notifDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: THEME.accent.lime, position: 'absolute', top: 5, right: 5, borderWidth: 1.5, borderColor: THEME.bg.primary },

    // Toggle
    toggleWrap: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 11, padding: 3, borderWidth: 1, borderColor: THEME.border.default, gap: 2 },
    toggleBtnGrad: { flex: 1, borderRadius: 9, overflow: 'hidden' },
    toggleBtnInner: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    toggleBtnInactive: { backgroundColor: 'transparent' },
    toggleText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

    // Glass card
    glassCard: { backgroundColor: THEME.bg.card, borderWidth: 1, borderColor: THEME.border.default, borderRadius: 16, padding: 15, marginBottom: 14 },
    sectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 2, color: THEME.text.muted, textTransform: 'uppercase', marginBottom: 10 },

    // Route
    routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 10 },
    locationInputWrap: { flex: 1, position: 'relative', zIndex: 10 },
    locationInputRight: { zIndex: 9 },
    routeField: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 11, borderWidth: 1 },
    routeFieldLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: THEME.text.muted, textTransform: 'uppercase', marginBottom: 3 },
    routeCode: { fontSize: 22, fontWeight: '900', color: THEME.text.primary, letterSpacing: 0.5 },
    routeCity: { fontSize: 10, color: THEME.text.muted, marginTop: 2 },
    alignRight: { textAlign: 'right' },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    cityTextInput: { flex: 1, fontSize: 18, fontWeight: '900', color: THEME.text.primary, letterSpacing: 0.5, padding: 0, margin: 0 },
    swapBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

    // Suggestions
    suggestionsList: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: THEME.bg.overlay, borderWidth: 1, borderColor: THEME.border.focus, borderRadius: 12, zIndex: 999, overflow: 'hidden' },
    suggestionsRight: {},
    suggestionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
    suggestionBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
    suggestionFlag: { fontSize: 16 },
    suggestionName: { fontSize: 12, fontWeight: '700', color: THEME.text.primary },
    suggestionCountry: { fontSize: 10, color: THEME.text.muted, marginTop: 1 },
    suggestionCode: { fontSize: 13, fontWeight: '800', color: THEME.accent.lime, letterSpacing: 0.5 },

    // Dates
    dateRow: { flexDirection: 'row', gap: 8 },
    dateField: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 9, borderWidth: 1, borderColor: THEME.border.default },
    dateLabel: { fontSize: 8, color: THEME.text.muted, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    dateVal: { fontSize: 11, fontWeight: '700', color: THEME.text.primary, marginTop: 1 },

    // Search button
    searchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 13 },
    searchBtnText: { fontSize: 12, fontWeight: '800', color: THEME.bg.primary, letterSpacing: 1.5 },

    // Wallet
    walletCard: { backgroundColor: 'rgba(168,85,247,0.07)', borderWidth: 1, borderColor: THEME.border.purple, borderRadius: 16, padding: 15, marginBottom: 14 },
    walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    walletTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    walletTitle: { fontSize: 12, fontWeight: '800', color: THEME.accent.purple, letterSpacing: 0.5 },
    activeBadge: { backgroundColor: THEME.accent.limeDim, borderWidth: 1, borderColor: THEME.border.lime, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
    activeBadgeText: { fontSize: 8, fontWeight: '800', color: THEME.accent.lime, letterSpacing: 1 },
    avatar: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: THEME.bg.primary },
    avatarText: { fontWeight: '800', color: THEME.text.primary },
    avatarStack: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    avatarMoreChip: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: THEME.border.default, borderStyle: 'dashed', marginLeft: -9 },
    avatarMoreText: { fontSize: 10, fontWeight: '700', color: THEME.text.secondary },
    poolingLabel: { fontSize: 8, fontWeight: '700', color: THEME.text.muted, letterSpacing: 1, textTransform: 'uppercase' },
    poolingNames: { fontSize: 11, fontWeight: '600', color: THEME.text.secondary, marginTop: 2 },
    collectedText: { fontSize: 22, fontWeight: '900', color: THEME.accent.lime },
    goalText: { fontSize: 11, color: THEME.text.muted },
    progressBarBg: { height: 7, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 5, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 5 },
    progressMetaLeft: { fontSize: 9, color: THEME.text.muted },
    progressMetaRight: { fontSize: 9, color: THEME.accent.purple, fontWeight: '700' },

    // Tabs
    tabRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
    tab: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    tabActive: { backgroundColor: 'rgba(168,85,247,0.12)', borderColor: THEME.border.purple },
    tabText: { fontSize: 10, fontWeight: '700', color: THEME.text.muted, letterSpacing: 0.3 },
    tabTextActive: { color: THEME.accent.purple },

    // Contributors
    contributorRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', gap: 8 },
    contributorName: { flex: 1, fontSize: 12, fontWeight: '600', color: THEME.text.primary },
    miniBarBg: { width: 60, height: 3, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 2 },
    miniBarFill: { height: '100%', borderRadius: 2 },
    contributorAmount: { fontSize: 11, fontWeight: '800', minWidth: 50, textAlign: 'right' },

    // BODHI Brain
    bodhiBrain: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(212,255,0,0.06)', borderWidth: 1, borderColor: THEME.border.lime, borderRadius: 9, padding: 9, marginTop: 10 },
    brainPulse: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: THEME.accent.lime },
    brainText: { fontSize: 11, fontWeight: '700', color: THEME.accent.lime },

    // Results
    resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
    resultsTitle: { fontSize: 15, fontWeight: '800', color: THEME.text.primary },
    filterBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    filterText: { fontSize: 11, color: THEME.accent.purple, fontWeight: '700' },

    // Flight card
    flightCard: { backgroundColor: THEME.bg.secondary, borderRadius: 16, overflow: 'hidden', marginBottom: 11 },
    flightImageBg: { height: 84, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    flightCityWatermark: { fontSize: 42, fontWeight: '900', color: 'rgba(255,255,255,0.05)', position: 'absolute', bottom: 4, right: 12, letterSpacing: -2 },
    insightTag: { position: 'absolute', top: 9, left: 9, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3 },
    insightText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
    selectedBadge: { position: 'absolute', top: 9, right: 9, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, flexDirection: 'row', alignItems: 'center', gap: 3 },
    selectedBadgeText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
    flightBody: { padding: 13 },
    flightRouteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    cityCode: { fontSize: 20, fontWeight: '900', color: THEME.text.primary, letterSpacing: 0.5 },
    timeLabel: { fontSize: 9, color: THEME.text.muted, fontWeight: '600', marginTop: 2 },
    flightLineWrap: { flex: 1, alignItems: 'center', marginHorizontal: 8, position: 'relative' },
    flightLine: { height: 1, width: '100%', backgroundColor: THEME.border.default },
    flightDurationChip: { flexDirection: 'row', alignItems: 'center', gap: 2, position: 'absolute', top: -8, backgroundColor: THEME.bg.secondary, paddingHorizontal: 3 },
    flightDuration: { fontSize: 8, color: THEME.text.muted, fontWeight: '600' },
    flightBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    airlineName: { fontSize: 10, color: THEME.text.muted },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 3 },
    ratingText: { fontSize: 10, color: THEME.text.muted, marginLeft: 2 },
    flightPrice: { fontSize: 20, fontWeight: '900' },
    flightPriceSub: { fontSize: 9, color: THEME.text.muted, textAlign: 'right' },

    // Skeleton
    skeletonCode: { width: 44, height: 22, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 4 },
    skeletonLine: { height: 9, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, marginTop: 8 },

    // Empty state
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
    emptyStateText: { fontSize: 14, fontWeight: '700', color: THEME.text.secondary },
    emptyStateSub: { fontSize: 12, color: THEME.text.muted },

    // CTA
    ctaWrap: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: THEME.bg.primary },
    lockBtn: { borderRadius: 15, padding: 17 },
    lockBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
    lockBtnText: { fontSize: 14, fontWeight: '800', letterSpacing: 1 },
    lockBtnSub: { fontSize: 10, letterSpacing: 0.3, marginTop: 2 },
});