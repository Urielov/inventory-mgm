// src/components/SignaturePadModal.js
import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePadModal = forwardRef(({ onSave, onCancel }, ref) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center'
  }}>
    <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
      <h3>חתום כאן</h3>
      <SignatureCanvas
        penColor="black"
        canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }}
        ref={ref}
      />
      <div style={{ marginTop: '10px' }}>
        <button onClick={() => ref.current.clear()} style={{ marginRight: '10px' }}>נקה</button>
        <button onClick={onSave} style={{ marginRight: '10px' }}>שמור חתימה</button>
        <button onClick={onCancel}>ביטול</button>
      </div>
    </div>
  </div>
));

export default SignaturePadModal;