import React,{useEffect} from 'react'
import SectionHome1 from '../Components/SectionHome1.jsx'
import SectionHome2 from '../Components/SectionHome2.jsx'
import SectionHome3 from '../Components/SectionHome3.jsx'
import TrendingHome from '../Components/TrendingHome.jsx'

import axios from 'axios'

import { usePriceContext } from '../ContextAPI/PriceContext.jsx'
import BannerHome from '../Components/BannerHome.jsx'


const continentMapping = {
  "IN": "Asia",
  "US": "North America",
  "GB": "Europe",
  "AU": "Australia",
  // Add more country codes and their continents as needed
};


const Home = () => {
 const { toConvert, priceIncrease ,setLocation } = usePriceContext();
 const [banner, setBanner] = React.useState("");
 const[Loading,setLoading] = React.useState(true)

useEffect(() => {
  axios.get("https://ipapi.co/json/")
    .then((response) => {
      const data = response.data;
     
      setLocation(continentMapping[data?.country] || "Not available");
    })
    .catch((error) => {
      console.log(error.message);
      setLocation("Asia");
    });
    
    const pagebanner = async () => {
    try {
      const res = await axios.get("https://duco-backend.onrender.com/api/banners");
      // backend sends { success:true, banners:[{_id, link}, ...] }
      setBanner(res.data.banners?.[0]?.link || "");
       setLoading(false)
    } catch (err) {
      console.error("Failed to fetch banner data:", err);
      setBanner([]); // fallback empty
    }
    finally{
      setLoading(false)
    }
    
  };

  pagebanner();
}, []);



  return (
    <div className='h-full bg-[#0A0A0A] w-full  '>
        <SectionHome1 imglink={banner} Loading={Loading} />
        < SectionHome2 />'
         <BannerHome link={"https://ik.imagekit.io/vuavxn05l/5213288.jpg?updatedAt=1757162698605"}/>
          < TrendingHome/>
        <SectionHome3/>
   

       
      

    </div>
  )
}

export default Home