import { useState } from 'react'
import LocationAccessComponent from './components/LocationAccessComponent'
import NewCustomerComponent from './components/NewCustomerComponent'
import CouponPageComponent from './components/CoupounPageComponent'


// Flow steps
const STEP = {
  LOCATION: 'location',
  FORM: 'form',
  COUPON: 'coupon',
}

function App() {
  const [step, setStep] = useState(STEP.LOCATION)
  const [formData, setFormData] = useState(null);
  const [location, setLocation] = useState(null)

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
        <NewCustomerComponent onSubmit={handleFormSubmit} location={location} />
      )}

      {step === STEP.COUPON && (
        <CouponPageComponent formData={formData} location={location} />
      )}
    </>
  )
}

export default App