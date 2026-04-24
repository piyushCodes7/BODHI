import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { isTablet, isLandscape, responsiveFont, responsiveWidth, responsiveHeight } from '../utils/responsive';
import { useOAuthSignIn } from '../hooks/useOAuthSignIn';

interface SocialAuthButtonsProps {
    onSuccess: (accessToken: string, isNewUser: boolean) => void;
}

export function SocialAuthButtons({ onSuccess }: SocialAuthButtonsProps) {
    const { isLoading, handleGoogleLogin, handleAppleLogin } = useOAuthSignIn();

    const onGooglePress = async () => {
        const result = await handleGoogleLogin();
        if (result) onSuccess(result.accessToken, result.isNewUser);
    };

    const onApplePress = async () => {
        const result = await handleAppleLogin();
        if (result) onSuccess(result.accessToken, result.isNewUser);
    };

    return (
        <View style={styles.container}>
            {/* Apple Button - Only render on iOS */}
            {Platform.OS === 'ios' && (
                <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={onApplePress}
                    disabled={isLoading !== null}
                >
                    {isLoading === 'apple' ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={[styles.iconText, { fontSize: responsiveFont(28), marginBottom: 4 }]}></Text>
                    )}
                </TouchableOpacity>
            )}

            {/* Google Button */}
            <TouchableOpacity
                style={styles.socialBtn}
                onPress={onGooglePress}
                disabled={isLoading !== null}
            >
                {isLoading === 'google' ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.iconText}>G</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 20,
    },
    socialBtn: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    iconText: {
        fontSize: responsiveFont(22),
        color: '#FFF',
        fontWeight: '800',
    },
});