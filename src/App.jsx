import { useState, useEffect } from 'react'
import axios from 'axios'
import LocationAccessComponent from './components/LocationAccessComponent'
import NewCustomerComponent from './components/NewCustomerComponent'
import CouponPageComponent from './components/CoupounPageComponent'

// Parse QR GUID from URL format: ?UID:<guid>
// e.g. https://yourapp.com?UID:3fa85f64-5717-4562-b3fc-2c963f66afa6
function parseQrGuid() {
  const search = window.location.search; 

  if (search.startsWith('?UID:')) {
    return search.replace('?UID:', '');
  }
  
  if (search.startsWith('?UID=')) {
    return search.replace('?UID=', '');
  }

  const path = window.location.pathname; 

  if (path.startsWith('/UID:')) {
    return path.replace('/UID:', '');
  }

  return '';
}


// Flow steps
const STEP = {
  LOCATION: 'location',
  FORM: 'form',
  COUPON: 'coupon',
}

const ABIS_BASE = '/api';

function App() {
  const [step, setStep] = useState(STEP.LOCATION)
  const [formData, setFormData] = useState(null);
  const [location, setLocation] = useState(null)
  const qrGuid = parseQrGuid();

  // Fire insertScan as soon as the QR is scanned (page first loads)
  useEffect(() => {
    if (!qrGuid) return;
    axios
      .post(`${ABIS_BASE}/Promotions/insertScan?promotionDetailId=${qrGuid}`)
      .then(() => console.log('Scan recorded for:', qrGuid))
      .catch((err) => console.error('insertScan failed:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLocationGranted = ({ latitude, longitude }) => {
    setLocation({ latitude, longitude })
    setStep(STEP.FORM);
    console.log(latitude, longitude);

  }

  const handleFormSubmit = (data) => {
    setFormData(data)
    setStep(STEP.COUPON)
  }

  return (
    <>
      {step === STEP.LOCATION && (
        <LocationAccessComponent onGranted={handleLocationGranted} />
      )}

      {step === STEP.FORM && (
        <NewCustomerComponent onSubmit={handleFormSubmit} location={location} qrGuid={qrGuid} />
      )}

      {step === STEP.COUPON && (
        <CouponPageComponent formData={formData} location={location} />
      )}
    </>
  )
}

export default App