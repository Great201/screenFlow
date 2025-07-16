
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Home = () => {
	const [url, setUrl] = React.useState<string>('');
	const navigate = useNavigate();
	const testValidURL = (url: string) => {
		try {
			new URL(url);
			return true;
		} catch (error) {
			return false;
		}
	};

	const handleURL = () => {
		if (!url || url === '') {
			toast.error('Add a url to continue !!!');
			return false;
		}
		// Normalize URL
		let normalizedUrl = url;
		if (!/^https?:\/\//i.test(normalizedUrl)) {
			normalizedUrl = 'https://' + normalizedUrl;
		}
		const isValid = testValidURL(normalizedUrl);
		if (isValid) {
			navigate(`/shot?url=${encodeURIComponent(normalizedUrl)}`)
		} else {
			toast.error('Invalid URL');
		}
	}

  return (
    <div className='w-full h-screen bg-purple-200 overflow-hidden flex flex-col items-center justify-center'>
      <img src="/left.png" alt="left-top" className='h-2/3 absolute top-0 left-0'/>
      <img src="/right.png" alt="right-bottom" className='h-2/3 absolute bottom-0 right-0' />
			{/* body */}
			<div className='flex flex-col items-center z-10'>
				<img src="/logo.png" className='w-14 h-14' alt="logo" />
				<img src="/logo2.png" className='w-1/2 my-2' alt="logo" />
				<p className='my-1 font-light text-sm w-2/5 text-center mx-auto'>Capture full websites in one click.</p>
				<div className='w-full h-10 rounded-full bg-white overflow-hidden'>
					<input type="url" name='url' placeholder='Enter website url here' onChange={(e) => {setUrl(e.target.value)}} className='w-full h-full p-2 font-light text-sm text-center focus:outline-none font-sans bg-white text-black placeholder:text-neutral-400'/>
				</div>
				<button
					onClick={handleURL} 
					className='w-2/3 h-12 p-3 rounded-full border-2 border-white hover:shadow-lg hover:shadow-neutral-500 duration-500 text-white text-sm font-medium bg-gradient-to-br from-purple-500 to-rose-500 my-5'>
					Start Capture
				</button>
				<p className='font-semibold font-sans text-slate-500'>Don’t know ScreenFlow works? {'\t'}
					<Link to='/' className='bg-gradient-to-br from-purple-600 to-rose-600 text-transparent bg-clip-text hover:scale-105 duration-500 text-center flex justify-center'>
						Check How!
					</Link>
				</p>
			</div>
			<div className='flex flex-row items-center gap-6 absolute bottom-3 left-1/2 -translate-x-1/2'>
				<Link to={'/'} className='text-slate-500'>Privacy</Link>
				<Link to={'/'} className='text-slate-500'>Terms</Link>
				<Link to={'/'} className='text-slate-500'>Support</Link>
			</div>
    </div>
  )
}

export default Home;