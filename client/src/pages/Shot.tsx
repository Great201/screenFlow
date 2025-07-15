import React from "react";
import { FaFile, FaTimesCircle } from "react-icons/fa";
import { PiSpinnerGapBold } from "react-icons/pi";
import { RiCameraLensLine, RiTimerFill } from "react-icons/ri";
import Switch from 'react-switch';


const Shot = () => {
  const [isSwitchOn, setIsSwitchOn] = React.useState(false);
  const [start, setStart] = React.useState(false)
  const startCapture = () => {}
  const endSession = () => {}
  
  return (
    <div className="w-full h-screen">
			<iframe src='https://www.9jawork.com/' className='w-full h-full mx-auto'>
			</iframe>
      {/* popup 1 desktop */}
      {!start && <div className="z-50 absolute top-3 right-5 rounded-lg p-4 bg-white w-10/12 md:w-4/12 lg:w-3/12 shadow-lg shadow-neutral-500 hidden md:block">
        <img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" />
        <img src="/logo2.png" alt="logo" className="w-1/3 my-2 mx-auto" />
        <div className="w-full grid grid-cols-2 gap-2">
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
        </div>
        <div className="w-full h-10 my-4 border-[1px] border-neutral-200 rounded-full overflow-hidden">
          <select className="text-sm p-2 w-full focus:outline-none">
            <option value={''}>All View (Desktop & Mobile)</option>
            <option value={''}>Desktop View only</option>
            <option value={''}>Mobile View only</option>
          </select>
        </div>
        <div className="flex flex-row items-center justify-between">
          <p className="font-medium text-sm my-2">View the life capture</p>
          <Switch 
            onChange={setIsSwitchOn} 
            checked={isSwitchOn} 
            uncheckedIcon={<></>}
            checkedIcon={<></>}
          />
        </div>
        <button onClick={startCapture} className="text-white font-medium text-sm bg-gradient-to-br from-purple-500 to-rose-500 w-full p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
          <RiCameraLensLine size={20} className="text-white" />
          Begin Capture
        </button>
      </div>}
      {/* popup 1 mobile */}
      {!start && <div className="z-50 absolute bottom-3 right-1/2 translate-x-1/2 rounded-lg p-4 bg-white w-10/12 md:w-1/5 lg:w-2/10 shadow-lg shadow-neutral-500 block md:hidden">
        <img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" />
        <img src="/logo2.png" alt="logo" className="w-1/3 my-2 mx-auto" />
        <div className="w-full grid grid-cols-2 gap-2">
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
        </div>
        <div className="w-full h-10 my-4 border-[1px] border-neutral-200 rounded-full overflow-hidden">
          <select className="text-sm p-2 w-full focus:outline-none">
            <option value={''}>All View (Desktop & Mobile)</option>
            <option value={''}>Desktop View only</option>
            <option value={''}>Mobile View only</option>
          </select>
        </div>
        <div className="flex flex-row items-center justify-between">
          <p className="font-medium text-sm my-2">View the life capture</p>
          <Switch 
            onChange={setIsSwitchOn} 
            checked={isSwitchOn} 
            uncheckedIcon={<></>}
            checkedIcon={<></>}
          />
        </div>
        <button onClick={startCapture} className="text-white font-medium text-sm bg-gradient-to-br from-purple-500 to-rose-500 w-full p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
          <RiCameraLensLine size={20} className="text-white" />
          Begin Capture
        </button>
      </div>}
      {/* popup 2 desktop*/}
      {start && <div className="z-50 absolute top-3 right-5 rounded-lg p-4 bg-white w-10/12 md:w-3/12 lg:w-2/12 shadow-lg shadow-neutral-500 hidden md:block">
        <img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" />
        <img src="/logo2.png" alt="logo" className="w-1/3 my-2 mx-auto" />
        <button onClick={startCapture} className="text-white font-medium text-sm bg-gradient-to-br from-purple-400 to-rose-400 w-full p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
          Capturing {'2/12'}
          <PiSpinnerGapBold size={20} className="text-white animate-spin" />
        </button>
        <button onClick={endSession} className="text-xs flex items-center justify-center gap-1 mx-auto my-4 text-neutral-600"><FaTimesCircle size={10} className="text-neutral-600" /> End Session</button>
      </div>}
      {/* popup 2 mobile  */}
      {start && <div className="z-50 absolute bottom-5 right-1/2 translate-x-1/2 rounded-lg p-4 bg-white w-2/3 md:w-1/5 lg:w-2/10 shadow-lg shadow-neutral-500 block md:hidden">
        <img src="/logo.png" alt="logo" className="w-8 h-8 mx-auto" />
        <img src="/logo2.png" alt="logo" className="w-1/3 my-2 mx-auto" />
        <button onClick={startCapture} className="text-white font-medium text-sm bg-gradient-to-br from-purple-400 to-rose-400 w-full p-3 my-4 rounded-full flex gap-2 items-center justify-center hover:shadow-md">
          Capturing {'2/12'}
          <PiSpinnerGapBold size={20} className="text-white animate-spin" />
        </button>
        <button onClick={endSession} className="text-xs flex items-center justify-center gap-1 mx-auto my-4 text-neutral-600"><FaTimesCircle size={10} className="text-neutral-600" /> End Session</button>
      </div>}
    </div>
  )
}

export default Shot;