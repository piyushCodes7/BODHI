import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
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
        <>
            {/* Apple Button - Only render on iOS */}
            {Platform.OS === 'ios' && (
                <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={onApplePress}
                    disabled={isLoading !== null}
                >
                    {isLoading === 'apple' ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={{ fontSize: 24, color: '#000', marginBottom: 2 }}></Text>
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
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={{ fontSize: 20, fontWeight: '800', color: '#000' }}>G</Text>
                )}
            </TouchableOpacity>
        </>
    );
}

const styles = StyleSheet.create({
    socialBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
});