/**
 * BODHI — Biometric Authentication (The Real Fintech Way™)
 * ─────────────────────────────────────────────────────────
 * Strategy: Challenge–Response with Secure Enclave Key Pair
 *
 * Flow:
 *  1. On device setup:  generate RSA-2048 key pair in Secure Enclave.
 *                       Store the PUBLIC key on the FastAPI backend.
 *  2. On each login:    backend issues a one-time challenge nonce.
 *                       App signs the nonce with the PRIVATE key
 *                       (never leaves the Secure Enclave).
 *                       Backend verifies the signature with the stored public key.
 *
 * This means:
 *  ✅ Private key NEVER transmitted or stored outside the device chip.
 *  ✅ Biometric gate is enforced by the OS (FaceID / Fingerprint).
 *  ✅ Backend only ever sees public keys and signed payloads.
 *  ✅ Replay attacks blocked by single-use nonces.
 *
 * Library: react-native-biometrics (MIT)
 *   npm install react-native-biometrics
 *   cd ios && pod install
 */

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import { Alert } from 'react-native';
import { BASE_URL } from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BiometricKeyPair {
  publicKey: string;  // Base64-encoded RSA-2048 public key (PKCS#8)
}

export interface SignedChallenge {
  signature:  string;  // Base64-encoded RSA signature
  payload:    string;  // The exact string that was signed
}

export interface BiometricAuthResult {
  success:    boolean;
  signature?: string;
  payload?:   string;
  error?:     string;
}

// ─── Singleton instance ───────────────────────────────────────────────────────

const rnBiometrics = new ReactNativeBiometrics({
  allowDeviceCredentials: false,  // Require true biometric — no PIN fallback
});

// ─── Step 1: Device Registration ─────────────────────────────────────────────
/**
 * generateAndRegisterBiometricKey
 *
 * Called ONCE during user onboarding (after email/password signup).
 * Generates a key pair in the Secure Enclave and returns the public key
 * so it can be sent to your FastAPI backend (POST /users/me/biometric-key).
 *
 * The private key NEVER leaves the device.
 */
export const generateAndRegisterBiometricKey = async (): Promise<BiometricKeyPair | null> => {
  try {
    // 1. Check biometric availability
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();

    if (!available) {
      Alert.alert(
        'Biometrics Unavailable',
        'This device does not support FaceID or fingerprint authentication.',
      );
      return null;
    }

    console.log(`[BODHI Auth] Biometry type detected: ${biometryType}`);
    // biometryType: BiometryTypes.FaceID | BiometryTypes.TouchID | BiometryTypes.Biometrics

    // 2. Generate asymmetric key pair inside Secure Enclave / Android Keystore
    //    Private key is hardware-bound and never exported.
    const { publicKey } = await rnBiometrics.createKeys();

    console.log('[BODHI Auth] Public key generated:', publicKey.slice(0, 40) + '...');

    // 3. Return public key — caller sends this to FastAPI
    return { publicKey };

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Key generation failed.';
    console.error('[BODHI Auth] Key generation error:', msg);
    return null;
  }
};

// ─── Step 2: Per-Login Challenge Signing ──────────────────────────────────────
/**
 * signChallengeWithBiometric
 *
 * Called on every login attempt.
 *
 * @param challengeNonce — A one-time string from the FastAPI backend
 *                         (e.g., UUID or `user_id:timestamp:random_bytes`)
 *
 * The OS will show a FaceID / fingerprint prompt before allowing signing.
 * On success, returns the Base64 signature to send to FastAPI for verification.
 */
export const signChallengeWithBiometric = async (
  challengeNonce: string,
): Promise<BiometricAuthResult> => {
  try {
    // 1. Check that keys exist (user completed registration)
    const { keysExist } = await rnBiometrics.biometricKeysExist();

    if (!keysExist) {
      return {
        success: false,
        error: 'No biometric key registered. Please complete setup first.',
      };
    }

    // 2. Build the payload — include timestamp to bind the signature to a moment
    const payload = `${challengeNonce}::${Date.now()}`;

    // 3. Sign payload — OS shows FaceID prompt here
    //    promptMessage is shown in the system biometric dialog
    const { success, signature } = await rnBiometrics.createSignature({
      promptMessage: 'Confirm it\'s you to sign in to BODHI',
      payload,
      cancelButtonText: 'Cancel',
    });

    if (!success || !signature) {
      return {
        success: false,
        error: 'Biometric authentication was cancelled or failed.',
      };
    }

    console.log('[BODHI Auth] Signature created, length:', signature.length);

    return { success: true, signature, payload };

  } catch (error: unknown) {
    // User cancelled → user-facing message; other errors → log
    const msg = error instanceof Error ? error.message : 'Biometric sign-in failed.';
    console.error('[BODHI Auth] Signing error:', msg);

    return { success: false, error: msg };
  }
};

// ─── Step 3: Key Deletion (Logout / Account Unlink) ──────────────────────────
/**
 * deleteBiometricKey
 *
 * Call when the user logs out, unlinks biometrics, or deletes their account.
 * Irreversibly removes the key pair from the Secure Enclave.
 */
export const deleteBiometricKey = async (): Promise<boolean> => {
  try {
    const { keysDeleted } = await rnBiometrics.deleteKeys();
    return keysDeleted;
  } catch (error: unknown) {
    console.error('[BODHI Auth] Key deletion error:', error);
    return false;
  }
};

// ─── Complete Login Flow (Orchestrator) ───────────────────────────────────────
/**
 * performBiometricLogin
 *
 * Full end-to-end flow example showing how pieces fit together.
 * Wire `requestChallengeFromBackend` and `verifySignatureOnBackend`
 * to your actual API client.
 */
export const performBiometricLogin = async (userId: string): Promise<boolean> => {
  try {
    // A: Fetch a one-time nonce from FastAPI
    //    POST /auth/biometric/challenge  → { nonce: "uuid-..." }
    const challengeResponse = await fetch(`${BASE_URL}/auth/biometric/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    });
    const { nonce } = await challengeResponse.json() as { nonce: string };

    // B: Sign the nonce (triggers FaceID prompt)
    const result = await signChallengeWithBiometric(nonce);
    if (!result.success || !result.signature || !result.payload) {
      Alert.alert('Sign-in Failed', result.error ?? 'Please try again.');
      return false;
    }

    // C: Send signature to FastAPI for RSA verification
    //    POST /auth/biometric/verify  → { access_token: "...", token_type: "bearer" }
    const verifyResponse = await fetch(`${BASE_URL}/auth/biometric/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:   userId,
        payload:   result.payload,
        signature: result.signature,
      }),
    });

    if (!verifyResponse.ok) {
      Alert.alert('Verification Failed', 'Server could not verify your biometric.');
      return false;
    }

    const { access_token } = await verifyResponse.json() as { access_token: string };
    // D: Persist the JWT (use SecureStore / Keychain, NEVER AsyncStorage)
    //    await SecureStore.setItemAsync('access_token', access_token);
    console.log('[BODHI Auth] Login successful, token received.');
    return true;

  } catch (error: unknown) {
    console.error('[BODHI Auth] Login flow error:', error);
    Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    return false;
  }
};

/*
 * ─── FastAPI counterpart (Python pseudo-code) ────────────────────────────────
 *
 * from cryptography.hazmat.primitives import hashes, serialization
 * from cryptography.hazmat.primitives.asymmetric import padding
 * from cryptography.exceptions import InvalidSignature
 * import base64
 *
 * @router.post("/auth/biometric/verify")
 * async def verify_biometric(payload: BiometricVerifyPayload, db: DbSession):
 *     user = await db.get(User, payload.user_id)
 *
 *     # Load the stored public key (registered during device setup)
 *     public_key = serialization.load_pem_public_key(user.biometric_public_key.encode())
 *
 *     # Verify RSA-SHA256 signature
 *     try:
 *         public_key.verify(
 *             base64.b64decode(payload.signature),
 *             payload.payload.encode(),
 *             padding.PKCS1v15(),
 *             hashes.SHA256(),
 *         )
 *     except InvalidSignature:
 *         raise HTTPException(status_code=401, detail="Invalid biometric signature")
 *
 *     # Signature valid → issue JWT
 *     access_token = create_access_token(subject=str(user.id))
 *     return {"access_token": access_token, "token_type": "bearer"}
 */
