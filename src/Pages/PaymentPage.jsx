import React, { useState ,useMemo } from 'react';
import PaymentButton from '../Components/PaymentButton'; // Import the component
import { useLocation , useNavigate} from 'react-router-dom';
import { toast } from 'react-toastify';
import NetbankingPanel from '../Components/NetbankingPanel.jsx';

const PaymentPage = () => {
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showPayNow, setShowPayNow] = useState(false);
  const [netbankingType,setNetbankingType] = useState("")
  // const [bulk,SetBulkorder] = useState(false);
  const locations = useLocation();
 
   const orderpayload = locations.state

     const navigate = useNavigate();

  // console.log(orderpayload)



 const handlePaymentChange = (method) => {
  setPaymentMethod(method);
  setShowPayNow(method === 'online' || method === '50%'); 
};


  const handleSubmit = () => {
    if (paymentMethod === 'netbanking') {
       navigate('/order-processing', {
              state: {
               
                orderData: orderpayload,
                paymentmode:"netbanking"
              }});


      // TODO: Call API to place COD order here
      toast.success('Order Placed!');
      

    } else if (paymentMethod === '') {
      toast.error('Please select a payment method');
    }

  };
 
const isBulkOrder = useMemo(() => {
  const items = orderpayload?.items ?? [];
  return items.some(item =>
    Object.values(item?.quantity ?? {}).some(qty => Number(qty) >= 50)
  );
}, [orderpayload]);

console.log(isBulkOrder)


  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center text-[#0A0A0A] mb-6">Select Payment Method</h1>

        <div className="space-y-4">
          {/* Radio: COD */}
        
          {/* Radio: Online */}
          <div>
            <label className="flex items-center text-lg text-[#0A0A0A]">
              <input
                type="radio"
                name="paymentMethod"
                value="online"
                checked={paymentMethod === 'online'}
                onChange={() => handlePaymentChange('online')}
                className="mr-2"
              />
              Pay Online
            </label>

          </div>
            <div>
            <label className="flex items-center text-lg text-[#0A0A0A]">
              <input
                type="radio"
                name="paymentMethod"
                value="cod"
                checked={paymentMethod === 'cod'}
                onChange={() => handlePaymentChange('cod')}
                className="mr-2"
              />
              Pickup from Shop
            </label>
          </div>


          
          
           {/* Replace your existing COD block with this */}

       {isBulkOrder && (
        
<>  <div>
            <label className="flex items-center text-lg text-[#0A0A0A]">
              <input
                type="radio"
                name="paymentMethod"
                value="50%"
                checked={paymentMethod === '50%'}
                onChange={() => handlePaymentChange('50%')}
                className="mr-2"
              />
              50% pay  Online
            </label>
            
          </div>


            <div>
              <label className="flex items-start gap-3 text-lg text-[#0A0A0A]">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="netbanking"
                  checked={paymentMethod === "netbanking"}
                  onChange={() => handlePaymentChange("netbanking")}
                  className="mt-1"
                />
                <div className="w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="font-semibold">Netbanking</span>

                    {/* UPI / Account details selector */}
                    <select
                      value={netbankingType}
                      onChange={(e) => setNetbankingType(e.target.value)}
                      className="sm:ml-3 rounded-lg border border-gray-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#E5C870]"
                      disabled={paymentMethod !== "netbanking"}            // enable only when chosen
                    >
                      <option value="upi">UPI</option>
                      <option value="bank">Account Details</option>
                    </select>
                  </div>

                  {/* ✅ Show panel only when netbanking is selected */}
                  <NetbankingPanel
                    paymentMethod={paymentMethod}
                    netbankingType={netbankingType}
                  />
                </div>
              </label>
            </div>
            </>
          )}



          {!showPayNow && (

           
           (paymentMethod ==="netbanking") ?  <button
           onClick={() =>
  navigate("/order-processing", {
    state: {
      paymentId: "test_transtion",  // make sure this exists
      orderData: orderpayload,
      paymentmode: "netbanking"                // match backend check (case-sensitive)
    },
  })
}

              className="w-full mt-6 py-2 px-4 bg-[#E5C870] text-black rounded-lg hover:bg-[#D4B752] font-semibold"
            >
              Continue
            </button>
            :
        <button
           onClick={() =>
  navigate("/order-processing", {
    state: {
      paymentId: "test_transtion",  // make sure this exists
      orderData: orderpayload,
      paymentmode: "50%"                // match backend check (case-sensitive)
    },
  })
}

              className="w-full mt-6 py-2 px-4 bg-[#E5C870] text-black rounded-lg hover:bg-[#D4B752] font-semibold"
            >
              Continue
            </button>



          )}

          {showPayNow && (
            <div className="mt-6">
              <PaymentButton orderData={orderpayload} paymentMethod={paymentMethod}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
function DetailRow({ label, value, canCopy }) {
  const copy = () => navigator.clipboard.writeText(value);
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <div className="text-sm">
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-[#0A0A0A]">{value}</div>
      </div>
      {canCopy && (
        <button
          type="button"
          onClick={copy}
          className="ml-3 rounded-lg border px-2 py-1 text-xs hover:bg-[#E5C870] hover:text-black"
          title="Copy"
        >
          Copy
        </button>
      )}
    </div>
  );
}
function CopyRow({ label, value }) {
  const copy = () => navigator.clipboard.writeText(value);
  return (
    <div className="flex items-center justify-between rounded-lg border bg-gray-50 px-3 py-2">
      <div>
        <div className="text-gray-500">{label}</div>
        <div className="font-medium text-[#0A0A0A]">{value}</div>
      </div>
      <button
        type="button"
        onClick={copy}
        className="ml-3 rounded-lg border px-2 py-1 text-xs hover:bg-[#E5C870] hover:text-black"
        title="Copy"
      >
        Copy
      </button>
    </div>
  );
}

export default PaymentPage;


