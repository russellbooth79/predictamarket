/**
 * PersonalDetails.jsx — Signup Step 3
 *
 * Name, DOB, email, and address lookup.
 *
 * DOB: three separate inputs (Day / Month / Year) with auto-advance.
 * This is more mobile-friendly than a date picker — avoids the native
 * date input's inconsistent platform UI.
 *
 * Postcode lookup: calls lookupAddress() → dropdown → selecting an address
 * populates a summary panel. "Enter manually" expands inline address fields.
 */

import { useState, useRef } from 'react';
import { ArrowLeft, Search, ChevronDown } from 'lucide-react';
import ProgressDots from '../components/ProgressDots.jsx';
import FormField from '../components/FormField.jsx';
import AuthButton from '../components/AuthButton.jsx';
import { lookupAddress } from '../mockAuthService.js';

export default function PersonalDetails({ onNext, onBack, prefill = {}, totalSteps = 4, currentStep = 1 }) {
  const [firstName, setFirstName] = useState(prefill.firstName ?? '');
  const [lastName, setLastName] = useState(prefill.lastName ?? '');
  const [email, setEmail] = useState(prefill.email ?? '');

  // DOB as separate fields for controlled auto-advance
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  const [postcode, setPostcode] = useState('');
  const [addressLookupLoading, setAddressLookupLoading] = useState(false);
  const [addressResults, setAddressResults] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [manualLine1, setManualLine1] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [errors, setErrors] = useState({});

  const dobMonthRef = useRef(null);
  const dobYearRef = useRef(null);

  function validateDOB() {
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    if (!day || !month || !year || dobYear.length < 4) return false;
    const dob = new Date(year, month - 1, day);
    if (dob.getFullYear() !== year || dob.getMonth() !== month - 1 || dob.getDate() !== day) return false;
    // Must be 18+
    const now = new Date();
    const age = now.getFullYear() - year - (
      now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day) ? 1 : 0
    );
    return age >= 18;
  }

  function formatDOBAsISO() {
    const d = String(dobDay).padStart(2, '0');
    const m = String(dobMonth).padStart(2, '0');
    return `${dobYear}-${m}-${d}`;
  }

  function handleDobDay(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDobDay(val);
    if (val.length === 2) dobMonthRef.current?.focus();
  }

  function handleDobMonth(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDobMonth(val);
    if (val.length === 2) dobYearRef.current?.focus();
  }

  function handleDobYear(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setDobYear(val);
  }

  async function handleLookup() {
    if (!postcode.trim()) return;
    setAddressLookupLoading(true);
    setLookupError('');
    setAddressResults([]);
    setSelectedAddress(null);
    try {
      const results = await lookupAddress(postcode.trim());
      setAddressResults(results);
      if (results.length === 0) setLookupError('No addresses found for this postcode.');
    } catch {
      setLookupError('Address lookup failed. Please enter your address manually.');
    } finally {
      setAddressLookupLoading(false);
    }
  }

  function handleSelectAddress(addr) {
    setSelectedAddress(addr);
    setAddressResults([]);
  }

  function validate() {
    const errs = {};
    if (!firstName.trim()) errs.firstName = 'Required';
    if (!lastName.trim()) errs.lastName = 'Required';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required';
    if (!validateDOB()) errs.dob = 'You must be 18 or over';
    if (!selectedAddress && !showManual) errs.address = 'Please find or enter your address';
    if (showManual && !manualLine1.trim()) errs.address = 'Address line 1 required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    const address = showManual
      ? { line1: manualLine1.trim(), line2: null, city: manualCity.trim(), postcode: postcode.trim() }
      : selectedAddress;
    onNext({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      dob: formatDOBAsISO(),
      postcode: postcode.trim(),
      selectedAddress: address,
    });
  }

  const isFormFilled = firstName && lastName && email && dobDay && dobMonth && dobYear.length === 4
    && (selectedAddress || (showManual && manualLine1 && manualCity));

  return (
    <div className="flex flex-col h-full">
      {/* ── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-4" style={{ scrollPaddingBottom: '280px' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 rounded-xl"
          style={{ color: '#7B8CAA', background: 'rgba(255,255,255,0.05)' }}
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ProgressDots total={totalSteps} current={currentStep} />
        <div className="w-9" />
      </div>

      <h1 className="text-2xl font-black mb-1" style={{ color: '#F0F6FF' }}>A few details</h1>
      <p className="text-sm mb-8" style={{ color: '#7B8CAA' }}>
        Required by law — takes about 30 seconds.
      </p>

      {/* Name row */}
      <div className="flex gap-3 mb-4">
        <FormField
          label="First name"
          id="firstName"
          value={firstName}
          onChange={e => { setFirstName(e.target.value); setErrors(p => ({ ...p, firstName: '' })); }}
          error={errors.firstName}
          autoComplete="given-name"
          className="flex-1"
        />
        <FormField
          label="Last name"
          id="lastName"
          value={lastName}
          onChange={e => { setLastName(e.target.value); setErrors(p => ({ ...p, lastName: '' })); }}
          error={errors.lastName}
          autoComplete="family-name"
          className="flex-1"
        />
      </div>

      {/* Date of birth */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1.5 block" style={{ color: '#7B8CAA' }}>
          Date of birth
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={dobDay}
            onChange={handleDobDay}
            placeholder="DD"
            maxLength={2}
            className="flex-1 text-center font-mono text-base rounded-xl outline-none transition-all"
            style={{
              height: '56px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${errors.dob ? '#FF3366' : 'rgba(255,255,255,0.1)'}`,
              color: '#F0F6FF',
              caretColor: '#6C63FF',
            }}
          />
          <input
            ref={dobMonthRef}
            type="text"
            inputMode="numeric"
            value={dobMonth}
            onChange={handleDobMonth}
            placeholder="MM"
            maxLength={2}
            className="flex-1 text-center font-mono text-base rounded-xl outline-none transition-all"
            style={{
              height: '56px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${errors.dob ? '#FF3366' : 'rgba(255,255,255,0.1)'}`,
              color: '#F0F6FF',
              caretColor: '#6C63FF',
            }}
          />
          <input
            ref={dobYearRef}
            type="text"
            inputMode="numeric"
            value={dobYear}
            onChange={handleDobYear}
            placeholder="YYYY"
            maxLength={4}
            className="flex-[2] text-center font-mono text-base rounded-xl outline-none transition-all"
            style={{
              height: '56px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${errors.dob ? '#FF3366' : 'rgba(255,255,255,0.1)'}`,
              color: '#F0F6FF',
              caretColor: '#6C63FF',
            }}
          />
        </div>
        {errors.dob && <p className="text-xs mt-1" style={{ color: '#FF3366' }}>{errors.dob}</p>}
      </div>

      {/* Email */}
      <FormField
        label="Email address"
        id="email"
        type="email"
        value={email}
        onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })); }}
        error={errors.email}
        autoComplete="email"
        className="mb-4"
      />

      {/* Postcode lookup */}
      <div className="mb-4">
        <label className="text-sm font-medium mb-1.5 block" style={{ color: '#7B8CAA' }}>
          Postcode
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={postcode}
            onChange={e => { setPostcode(e.target.value.toUpperCase()); setLookupError(''); }}
            placeholder="SW1A 1AA"
            className="flex-1 rounded-xl px-4 outline-none uppercase font-mono text-base"
            style={{
              height: '56px',
              background: 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${errors.address ? '#FF3366' : 'rgba(255,255,255,0.1)'}`,
              color: '#F0F6FF',
              caretColor: '#6C63FF',
            }}
            autoComplete="postal-code"
          />
          <button
            type="button"
            onClick={handleLookup}
            disabled={!postcode.trim() || addressLookupLoading}
            className="flex items-center gap-2 px-4 rounded-xl text-sm font-semibold transition-opacity"
            style={{
              background: 'rgba(108,99,255,0.15)',
              border: '1px solid rgba(108,99,255,0.3)',
              color: '#9B8FFF',
              opacity: !postcode.trim() || addressLookupLoading ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            <Search className="w-4 h-4" />
            {addressLookupLoading ? 'Finding…' : 'Find address'}
          </button>
        </div>

        {lookupError && (
          <p className="text-xs mt-1" style={{ color: '#FF3366' }}>{lookupError}</p>
        )}
        {errors.address && !lookupError && (
          <p className="text-xs mt-1" style={{ color: '#FF3366' }}>{errors.address}</p>
        )}

        {/* Address dropdown results */}
        {addressResults.length > 0 && (
          <div
            className="mt-2 rounded-xl overflow-hidden"
            style={{
              background: 'rgba(15,20,35,0.98)',
              border: '1px solid rgba(108,99,255,0.25)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            }}
          >
            {addressResults.map(addr => (
              <button
                key={addr.id}
                type="button"
                onClick={() => handleSelectAddress(addr)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#F0F6FF' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(108,99,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#6C63FF' }} />
                <div>
                  <p className="text-sm font-medium">{addr.line1}</p>
                  {addr.line2 && <p className="text-xs" style={{ color: '#7B8CAA' }}>{addr.line2}</p>}
                  <p className="text-xs" style={{ color: '#7B8CAA' }}>{addr.city}, {addr.postcode}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected address summary */}
        {selectedAddress && (
          <div
            className="mt-2 px-4 py-3 rounded-xl flex items-center justify-between"
            style={{
              background: 'rgba(0,245,160,0.06)',
              border: '1px solid rgba(0,245,160,0.2)',
            }}
          >
            <div>
              <p className="text-sm font-medium" style={{ color: '#F0F6FF' }}>{selectedAddress.line1}</p>
              {selectedAddress.line2 && (
                <p className="text-xs" style={{ color: '#7B8CAA' }}>{selectedAddress.line2}</p>
              )}
              <p className="text-xs" style={{ color: '#7B8CAA' }}>{selectedAddress.city}, {selectedAddress.postcode}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedAddress(null)}
              className="text-xs ml-4 shrink-0"
              style={{ color: '#7B8CAA' }}
            >
              Change
            </button>
          </div>
        )}

        {/* Enter manually toggle */}
        {!selectedAddress && (
          <button
            type="button"
            onClick={() => setShowManual(m => !m)}
            className="mt-2 text-sm transition-colors"
            style={{ color: '#6C63FF' }}
          >
            {showManual ? 'Hide manual entry' : 'Enter address manually'}
          </button>
        )}

        {/* Manual address fields */}
        {showManual && !selectedAddress && (
          <div className="mt-3 flex flex-col gap-3">
            <FormField
              label="Address line 1"
              id="manualLine1"
              value={manualLine1}
              onChange={e => setManualLine1(e.target.value)}
              autoComplete="address-line1"
            />
            <FormField
              label="City"
              id="manualCity"
              value={manualCity}
              onChange={e => setManualCity(e.target.value)}
              autoComplete="address-level2"
            />
          </div>
        )}
      </div>

      </div> {/* end scrollable content */}

      {/* Sticky footer — always visible, respects home indicator */}
      <div
        className="px-6 pt-4"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(5,8,15,0.95)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <AuthButton
          variant="primary-gradient"
          disabled={!isFormFilled}
          onClick={handleNext}
        >
          Create my account
        </AuthButton>
      </div>
    </div>
  );
}
