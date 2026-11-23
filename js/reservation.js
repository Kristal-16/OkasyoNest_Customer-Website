/* ==========================================================
   OkasyoNest – reservation.js (reservation.html only)
   Requires js/data.js (HALLS, PACKAGES, PROMOS, SLOTS,
   PAYMENT_ACCOUNTS, DEPOSIT_AMOUNT) and js/main.js (OkasyoUI).

   BACKEND NOTES (for the back-end developer)
   - checkAvailability()     -> GET  /api/halls/:hallId/availability?date=&slot=
   - submitReservation()     -> POST /api/reservations
   - First-time / returning client detection, double-booking
     prevention, payment verification, and the quotation are
     all done by the backend. Nothing here is real-time data.
   ========================================================== */
(() => {
  'use strict';

  const form = document.getElementById('reservationForm');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
  const STORAGE_KEY = 'okasyonest_demo_reservation'; /* demo only – sessionStorage */

  /* Fields that can show an error, in the order they appear on the page. */
  const FIELD_ORDER = ['fullName', 'email', 'hall', 'eventDate', 'timeSlot', 'guests', 'catering', 'cashArrangement', 'paymentRef'];

  const submitBtn = $('submitBtn');
  const submitLabel = submitBtn.textContent;

  /* ==========================================================
     1. READING THE FORM
     ========================================================== */
  function getFormValues() {
    const f = form.elements;
    const guestsRaw = f.guests.value.trim();
    const guestsNum = Number(guestsRaw);
    return {
      fullName: f.fullName.value.trim(),
      email: f.email.value.trim(),
      eventType: f.eventType.value,
      hallKey: f.hall.value,
      eventDate: f.eventDate.value,
      timeSlot: f.timeSlot.value,
      guestsRaw,
      guests: guestsRaw !== '' && Number.isInteger(guestsNum) ? guestsNum : null,
      packageKey: f.catering.value,
      promoKey: f.promo.value,
      notes: f.notes.value.trim(),
      paymentMode: f.paymentMode.value,
      cashArrangement: f.cashArrangement.value,
      onlineChannel: f.onlineChannel.value,
      paymentRef: f.paymentRef.value.trim()
    };
  }

  /* ==========================================================
     2. PRICE CALCULATION
     Catering Subtotal = guests x price per head
     Base Total        = hall session rate + catering subtotal
     Discount          = base total x promo %   (only ONE promo)
     Estimated Total   = base total - discount
     Online: Remaining Balance = estimated total - P5,000 deposit
     Cash:   no deposit - the whole estimated total is paid at the office
     Nothing is calculated for empty / invalid / over-capacity guests.
     ========================================================== */
  function calculateReservationTotal(values) {
    const hall = HALLS[values.hallKey];
    const pkg = PACKAGES[values.packageKey];
    const promo = PROMOS[values.promoKey];
    const guestsValid = values.guests !== null && values.guests > 0 && (!hall || values.guests <= hall.capacity);

    const result = {
      hallRate: hall ? hall.rate : null,
      pricePerHead: pkg ? pkg.pricePerHead : null,
      discountPercent: promo ? promo.percent : 0,
      cateringSubtotal: null,
      baseTotal: null,
      discount: null,
      estimatedTotal: null,
      remainingBalance: null,
      deposit: values.paymentMode === 'cash' ? null : DEPOSIT_AMOUNT,
      amountDueAtOffice: null
    };
    if (!hall || !pkg || !guestsValid) return result;

    result.cateringSubtotal = values.guests * pkg.pricePerHead;
    result.baseTotal = hall.rate + result.cateringSubtotal;
    result.discount = (result.baseTotal * result.discountPercent) / 100;
    result.estimatedTotal = result.baseTotal - result.discount;
    if (values.paymentMode === 'cash') {
      result.amountDueAtOffice = result.estimatedTotal; /* whole payment at the office */
    } else {
      result.remainingBalance = Math.max(result.estimatedTotal - DEPOSIT_AMOUNT, 0);
    }
    return result;
  }

  /* ==========================================================
     3. LIVE RESERVATION SUMMARY
     ========================================================== */
  const money = (n) => (n === null || n === undefined ? '—' : peso.format(n));
  const setText = (id, text) => { $(id).textContent = text; };

  function formatDate(iso) {
    if (!iso) return 'Pick a date';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function paymentLabel(values) {
    if (values.paymentMode === 'online') {
      const names = { gcash: 'GCash', maya: 'Maya', bank: 'Bank Transfer' };
      return 'Online Payment • ' + (names[values.onlineChannel] || '');
    }
    return 'Cash Payment';
  }

  function updateReservationSummary() {
    const values = getFormValues();
    const calc = calculateReservationTotal(values);
    const hall = HALLS[values.hallKey];
    const pkg = PACKAGES[values.packageKey];
    const promo = PROMOS[values.promoKey];

    setText('sumHall', hall ? `${hall.name} (${hall.rate.toLocaleString('en-PH')})` : '—');
    setText('sumHallRate', money(calc.hallRate));
    setText('sumDateSlot', `${formatDate(values.eventDate)} • ${SLOTS[values.timeSlot] || 'Select a slot'}`);
    setText('sumGuests', values.guests !== null && values.guests > 0 ? `${values.guests} Guests` : '—');
    setText('sumPackage', pkg ? pkg.name : '—');
    setText('sumPerHead', calc.pricePerHead !== null ? `${money(calc.pricePerHead)} / head` : '—');
    setText('sumCatering', money(calc.cateringSubtotal));
    setText('sumPromo', promo ? promo.name : '—');
    setText('sumDiscount', calc.discount === null ? '—' : `−${money(calc.discount)} (${calc.discountPercent}%)`);
    setText('sumPayment', paymentLabel(values));
    setText('sumTotal', money(calc.estimatedTotal));
    if (values.paymentMode === 'cash') {
      /* Cash: no deposit – proceed to the office for the whole payment */
      setText('sumDepositLabel', 'Proceed to Office for Whole Payment');
      setText('sumDeposit', money(calc.amountDueAtOffice));
      setText('sumDepositNote', 'Pay the whole amount in cash at the OkasyoNest office. Our OkasyoNest coordinator will send your itemized quotation within 2 hours.');
      $('sumBalanceRow').hidden = true;
    } else {
      setText('sumDepositLabel', 'Reservation Deposit to Lock Date');
      setText('sumDeposit', money(DEPOSIT_AMOUNT));
      setText('sumDepositNote', 'Deductible from your total package bill. Our OkasyoNest coordinator will send your itemized quotation within 2 hours.');
      setText('sumBalance', money(calc.remainingBalance));
      $('sumBalanceRow').hidden = false;
    }

    const note = $('sumNote');
    if (calc.estimatedTotal !== null) {
      note.textContent = 'Estimated amounts only. The final amounts appear in the itemized quotation from our coordinator.';
    } else if (hall && values.guests !== null && values.guests > hall.capacity) {
      note.textContent = `Guest count is above the ${hall.capacity}-guest capacity of ${hall.name}.`;
    } else {
      note.textContent = 'Enter a valid guest count to see your estimated total. Final amounts appear in the itemized quotation.';
    }
  }

  /* ==========================================================
     4. HALL CAPACITY HINT
     ========================================================== */
  function updateCapacityHint() {
    const hall = HALLS[form.elements.hall.value];
    const hint = $('capacityHint');
    const guestsInput = form.elements.guests;
    if (!hall) { hint.textContent = ''; return; }

    guestsInput.max = hall.capacity;
    const raw = guestsInput.value.trim();
    const over = raw !== '' && Number(raw) > hall.capacity;
    hint.classList.toggle('is-over', over);
    hint.textContent = over
      ? `${hall.name} holds up to ${hall.capacity} guests. Please lower your guest count.`
      : `Maximum capacity: ${hall.capacity} guests.`;
  }

  /* ==========================================================
     5. AVAILABILITY (placeholder – backend required)
     We never invent "available" or "booked" dates.
     ========================================================== */
  async function checkAvailability(hallKey, date, slot) {
    /* TODO (backend): replace with
       const res = await fetch(`${API_BASE_URL}/api/halls/${hallKey}/availability?date=${date}&slot=${slot}`);
       return res.json();  -> e.g. { available: true | false } */
    return {
      status: 'pending-backend',
      message: `Your request for ${HALLS[hallKey].name} on ${formatDate(date)} (${SLOTS[slot]}) can be sent now. Actual availability will be confirmed by the OkasyoNest team because live availability is not connected yet.`
    };
  }

  async function handleCheckAvailability() {
    const values = getFormValues();
    const msg = $('availabilityMsg');
    if (!HALLS[values.hallKey] || !values.eventDate || !values.timeSlot) {
      msg.textContent = 'Choose a hall, an event date, and a time slot first.';
      return;
    }
    if (values.eventDate < todayISO()) {
      msg.textContent = 'Please choose today or a future date.';
      return;
    }
    const result = await checkAvailability(values.hallKey, values.eventDate, values.timeSlot);
    msg.textContent = result.message;
  }

  /* ==========================================================
     6. PAYMENT UI
     ========================================================== */
  function renderOnlineChannel() {
    const channel = form.elements.onlineChannel.value;
    const account = PAYMENT_ACCOUNTS[channel];
    if (!account) return;
    setText('accTitle', account.title);
    setText('accName', account.accountName);
    setText('accNumber', account.accountNumber);
    setText('accBank', account.bankName);
    $('accBankRow').hidden = !account.bankName;
    form.elements.paymentRef.placeholder = account.refPlaceholder;
  }

  function syncPaymentUI() {
    const mode = form.elements.paymentMode.value;
    $('cashPanel').hidden = mode !== 'cash';
    $('onlinePanel').hidden = mode !== 'online';
    form.querySelectorAll('.pay-option, .radio-chip').forEach((label) => {
      label.classList.toggle('is-selected', label.querySelector('input').checked);
    });
    renderOnlineChannel();
  }

  async function copyAccountNumber() {
    const btn = $('copyNumberBtn');
    const text = $('accNumber').textContent.trim();
    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (err) {
      /* Fallback for browsers that block the Clipboard API. */
      const helper = document.createElement('textarea');
      helper.value = text;
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      try { copied = document.execCommand('copy'); } catch (e) { copied = false; }
      helper.remove();
    }
    btn.textContent = copied ? 'Copied!' : 'Copy failed';
    setTimeout(() => { btn.textContent = 'Copy Number'; }, 1800);
  }

  /* ==========================================================
     7. VALIDATION
     Returns an object { fieldName: 'message' } – empty means valid.
     ========================================================== */
  function todayISO() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  function validateReservationForm(values) {
    const errors = {};
    const hall = HALLS[values.hallKey];

    if (!values.fullName) errors.fullName = 'Enter your full name.';
    else if (!/^[\p{L}][\p{L}\s.'-]{1,}$/u.test(values.fullName)) errors.fullName = 'Use letters only (spaces, periods, hyphens, and apostrophes are fine).';

    if (!values.email) errors.email = 'Enter your email address.';
    else if (!isValidEmail(values.email)) errors.email = 'Use a valid email like name@example.com.';

    if (!hall) errors.hall = 'Choose a hall.';
    if (!PACKAGES[values.packageKey]) errors.catering = 'Choose a catering package.';

    if (!values.eventDate) errors.eventDate = 'Pick an event date.';
    else if (values.eventDate < todayISO()) errors.eventDate = 'Choose today or a future date.';

    if (!SLOTS[values.timeSlot]) errors.timeSlot = 'Choose a time slot.';

    if (values.guestsRaw === '') errors.guests = 'Enter your estimated number of guests.';
    else if (values.guests === null || values.guests < 1) errors.guests = 'Enter a whole number of 1 or more.';
    else if (hall && values.guests > hall.capacity) errors.guests = `${hall.name} holds up to ${hall.capacity} guests.`;

    if (values.paymentMode === 'cash') {
      if (!values.cashArrangement) errors.cashArrangement = 'Choose a cash payment arrangement.';
    } else {
      if (!values.paymentRef) errors.paymentRef = 'Enter the payment reference number from your receipt.';
      else if (!/^[A-Za-z0-9 #\-_]{6,40}$/.test(values.paymentRef)) errors.paymentRef = 'Use 6–40 letters or numbers (no special symbols).';
    }
    return errors;
  }

  function showErrors(errors) {
    FIELD_ORDER.forEach((name) => {
      const box = $('err-' + name);
      const field = form.elements[name];
      if (box) box.textContent = errors[name] || '';
      if (field && field.tagName) field.setAttribute('aria-invalid', errors[name] ? 'true' : 'false');
    });
    const hasErrors = Object.keys(errors).length > 0;
    setText('formStatus', hasErrors ? 'Please fix the highlighted fields before confirming.' : '');
  }

  function focusFirstError(errors) {
    const first = FIELD_ORDER.find((name) => errors[name]);
    if (!first) return;
    const field = form.elements[first];
    const target = field && field.tagName ? field : (field && field[0]) || null;
    if (target) target.focus();
  }

  function clearFieldError(name) {
    const box = $('err-' + name);
    const field = form.elements[name];
    if (box) box.textContent = '';
    if (field && field.tagName) field.setAttribute('aria-invalid', 'false');
  }

  /* ==========================================================
     8. SUBMISSION (demo only)
     ========================================================== */
  function generateReservationReference() {
    const d = new Date();
    const stamp = String(d.getFullYear()).slice(2) + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `DEMO-ON-${stamp}-${rand}`;
  }

  async function submitReservation(payload) {
    /* TODO (backend): send `payload` with
       await fetch(`${API_BASE_URL}/api/reservations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
       and use the reference number + status returned by the server.
       The prototype only stores a copy in sessionStorage. */
    const record = {
      ...payload,
      reference: generateReservationReference(),
      status: 'DEMO – PENDING REVIEW',
      submittedAt: new Date().toISOString()
    };
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch (err) { /* storage may be blocked */ }
    return record;
  }

  function addRow(list, label, value) {
    const row = document.createElement('div');
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = value; /* textContent keeps user input safe from HTML injection */
    row.append(dt, dd);
    list.appendChild(row);
  }

  function showConfirmation(record) {
    const v = record.values;
    const c = record.totals;
    const list = $('confirmList');
    list.replaceChildren();

    setText('confirmRef', record.reference);
    addRow(list, 'Name', v.fullName);
    addRow(list, 'Email', v.email);
    addRow(list, 'Event type', v.eventType);
    addRow(list, 'Hall', HALLS[v.hallKey].name);
    addRow(list, 'Date & slot', `${formatDate(v.eventDate)} • ${SLOTS[v.timeSlot]}`);
    addRow(list, 'Guests', String(v.guests));
    addRow(list, 'Catering package', PACKAGES[v.packageKey].name);
    addRow(list, 'Promotion', `${PROMOS[v.promoKey].name} (${PROMOS[v.promoKey].percent}%)`);
    addRow(list, 'Payment', paymentLabel(v));
    if (v.paymentMode === 'online') addRow(list, 'Payment reference', v.paymentRef);
    addRow(list, 'Estimated total', money(c.estimatedTotal));
    if (v.paymentMode === 'cash') {
      addRow(list, 'Whole payment at office', money(c.amountDueAtOffice));
    } else {
      addRow(list, 'Reservation deposit', money(c.deposit));
      addRow(list, 'Remaining balance', money(c.remainingBalance));
    }

    /* Payment status banner: online = "Paid Successfully", cash = whole payment still due at the office */
    const statusBox = $('confirmStatus');
    if (v.paymentMode === 'online') {
      statusBox.dataset.state = 'paid';
      setText('confirmCheck', '✓');
      setText('confirmStatusText', 'Paid Successfully');
    } else {
      statusBox.dataset.state = 'due';
      setText('confirmCheck', '₱');
      setText('confirmStatusText', 'Proceed to Office for Whole Payment');
    }

    setText('confirmNote', v.paymentMode === 'cash'
      ? 'Demo only: in the live system this would start a 48-hour pencil hold until the whole payment is made at the office. No date is booked yet.'
      : '');

    OkasyoUI.openModal('confirmModal');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const values = getFormValues();
    const errors = validateReservationForm(values);
    showErrors(errors);
    if (Object.keys(errors).length) {
      focusFirstError(errors);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';
    try {
      const record = await submitReservation({ values, totals: calculateReservationTotal(values) });
      showConfirmation(record);
    } catch (err) {
      console.error('Reservation submit failed:', err);
      setText('formStatus', 'Something went wrong while submitting. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
  }

  function resetReservationForm() {
    form.reset();
    showErrors({});
    syncPaymentUI();
    updateCapacityHint();
    updateReservationSummary();
    setText('availabilityMsg', 'Live availability will be loaded from the OkasyoNest system once the backend is connected. For now, your preferred date is only a request.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ==========================================================
     9. PRESELECTION FROM THE LANDING PAGE
     index.html links use ?hall=<key> and/or ?package=<key>.
     ========================================================== */
  function applyUrlPreselection() {
    const params = new URLSearchParams(window.location.search);
    const hall = params.get('hall');
    const pkg = params.get('package');
    if (hall && HALLS[hall]) form.elements.hall.value = hall;
    if (pkg && PACKAGES[pkg]) form.elements.catering.value = pkg;
  }

  /* ==========================================================
     10. INIT
     ========================================================== */
  function init() {
    form.elements.eventDate.min = todayISO(); /* no past dates */
    applyUrlPreselection();

    form.addEventListener('input', (e) => {
      if (e.target.name) clearFieldError(e.target.name);
      updateCapacityHint();
      updateReservationSummary();
    });
    form.addEventListener('change', () => {
      syncPaymentUI();
      updateCapacityHint();
      updateReservationSummary();
    });
    form.addEventListener('submit', handleSubmit);
    $('copyNumberBtn').addEventListener('click', copyAccountNumber);
    $('checkAvailabilityBtn').addEventListener('click', handleCheckAvailability);
    $('newReservationBtn').addEventListener('click', resetReservationForm);

    syncPaymentUI();
    updateCapacityHint();
    updateReservationSummary();
  }

  init();
})();