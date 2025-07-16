import axios from "axios";
import Lottie from "lottie-react";
import React from "react";
import { FaFile, FaTimesCircle } from "react-icons/fa";
import { PiFileZipFill, PiSpinnerGapBold } from "react-icons/pi";
import { RiCameraLensLine, RiTimerFill } from "react-icons/ri";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { BASE_URL } from "../../Utils/data";
import successAnim from "../assets/success.json";


const Shot = () => {
  const navigate = useNavigate();
  const [start, setStart] = React.useState(false);
  const [finish, setFinish] = React.useState(false);
  const location = useLocation();
  const [url, setUrl] = React.useState<string>('');
  const [mode, setMode] = React.useState<string>('desktop');
  const [downloadLink, setDownloadLink] = React.useState<string>('')
  // const navigate = useNavigate();
  

  const startCapture = async () => {
    try {
      setStart(true);
      await axios.post(`${BASE_URL}/api/screenshot`, { url, mode })
      .then((res) => {
        if (res.status === 200) {
          setDownloadLink(res.data?.downloadUrl)
          setStart(false);
          setFinish(true);
        }
      })
    } catch (error: any) {
      setStart(false);
      toast.error(String(error?.response?.message));
    }
  }
  const endSession = () => {
    try {
      navigate('/')
    } catch (error: any) {
      toast.error(String(error?.response?.message));
    }
  }

  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const urlFromParams = urlParams.get('url')
    setUrl(urlFromParams as string);
  },[location.search]);
  // React.useEffect(() => {
  //   if (url === '') {
  //     navigate('/');
  //   }
  // },[location.search]);
  return (
    <div className="w-full h-screen">
			<div className="bg-purple-100 w-full h-screen flex flex-col items-center justify-center">
        {/* popup 1 desktop */}
        {(!start && !finish) && <div className="z-50 rounded-lg p-4 bg-white w-10/12 md:w-4/12 lg:w-3/12 shadow-lg shadow-neutral-500">
            <Link to={'/'}><img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" /></Link>
            <img src="/logo2.png" alt="logo" className="w-1/3 my-2 mx-auto" />
          {/* <div className="w-full grid grid-cols-2 gap-2">
            <div className="w-full h-auto border-[1px] border-neutral-200 p-2 rounded-lg">
              <FaFile size={18} className="text-rose-600" />
              <p className="font-normal text-xs my-1">Pages</p>
              <h2 className="font-black text-xl text-neutral-700 my-2">12</h2>
            </div>
            <div className="w-full h-auto border-[1px] border-neutral-200 p-2 rounded-lg">
              <RiTimerFill size={18} className="text-blue-600" />
              <p className="font-normal text-xs my-1">Time to Capture</p>
              <h2 className="font-black text-xl text-neutral-700 my-2">2 mins</h2>
            </div>
          </div> */}
          <div className="w-full h-10 my-4 border-[1px] border-neutral-200 rounded-full overflow-hidden">
            <select className="text-sm p-2 w-full focus:outline-none" onChange={(e) => setMode(e.target.value) }>
              <option value={'both'}>All View (Desktop & Mobile)</option>
              <option value={'desktop'}>Desktop View only</option>
              <option value={'mobile'}>Mobile View only</option>
            </select>
          </div>
          {/* <div className="flex flex-row items-center justify-between">
            <p className="font-medium text-sm my-2">View the life capture</p>
            <Switch 
              onChange={setIsSwitchOn} 
              checked={isSwitchOn} 
              uncheckedIcon={<></>}
              checkedIcon={<></>}
            />
          </div> */}
          <button onClick={startCapture} className="text-white font-medium text-sm bg-gradient-to-br from-purple-500 to-rose-500 w-full p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
            <RiCameraLensLine size={20} className="text-white" />
            Begin Capture
          </button>
        </div>}
        {/* popup 2 desktop*/}
        {(start && !finish) && <div className="z-50 rounded-lg p-4 bg-white w-10/12 md:w-3/12 lg:w-2/12 shadow-lg shadow-neutral-500 hidden md:block">
          <img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" />
          <img src="/logo2.png" alt="logo" className="w-1/3 my-2 mx-auto" />
          <button onClick={startCapture} className="text-white font-medium text-sm bg-gradient-to-br from-purple-400 to-rose-400 w-full p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
            Capturing {'2/12'}
            <PiSpinnerGapBold size={20} className="text-white animate-spin" />
          </button>
          <button onClick={endSession} className="text-xs flex items-center justify-center gap-1 mx-auto my-4 text-neutral-600"><FaTimesCircle size={10} className="text-neutral-600" /> End Session</button>
        </div>}
        {/* popup 3  */}
        {finish && <div className="z-50 rounded-lg p-4 bg-white w-10/12 md:w-3/12 lg:w-3/12 shadow-lg shadow-neutral-500 hidden md:block">
          <img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" />
          <img src="/logo2.png" alt="logo" className="w-1/2 my-2 mx-auto" />
          <div>
            <Lottie animationData={successAnim} className="w-1/3 mx-auto my-3" />
            {/* 2  */}
            {/* <div className="w-full grid grid-cols-2 gap-2">
              <div className="w-full h-auto border-[1px] border-neutral-200 p-2 rounded-lg">
                <FaFile size={18} className="text-rose-600" />
                <p className="font-normal text-xs my-1">Pages</p>
                <h2 className="font-black text-xl text-neutral-700 my-2">12</h2>
              </div>
              <div className="w-full h-auto border-[1px] border-neutral-200 p-2 rounded-lg">
                <RiTimerFill size={18} className="text-blue-600" />
                <p className="font-normal text-xs my-1">Time to Capture</p>
                <h2 className="font-black text-xl text-neutral-700 my-2">2 mins</h2>
              </div>
            </div> */}
          </div>
            {/* 3  */}
          <a href={`${BASE_URL}${downloadLink}`} download={true}><button className="text-white font-medium mx-auto text-sm bg-gradient-to-br from-purple-500 to-rose-500 w-full shadow-md p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
            <PiFileZipFill size={20} className="text-white" />
            Download Zip
          </button></a>
        </div>}
      </div>
    </div>
  )
}

export default Shot;