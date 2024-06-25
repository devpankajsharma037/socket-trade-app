

'use client';
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { ArrowRightIcon } from '@heroicons/react/24/solid';
const socket = io('http://localhost:3000');

export default function Home() {
  const [tradeDetails, setTradeDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('message2', (data) => {
      console.log('Received from SERVER ::', data);
      setLoading(false);  // Stop loading when data is received
      setTradeDetails(JSON.parse(data));
    });

    return () => {
      socket.off('message2');
    };
  }, []);

  const handleTrade = () => {
    setLoading(true);  // Start loading when trade button is clicked
    socket.emit('message', JSON.stringify({ action: 'trade' }));
  };
  // Function to format JSON for display
  const formatJson = (json) => {
    return JSON.stringify(json, null, 2);
  };

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <h1 className='text-white'>Trading App</h1>
          </div>
        </div>
      </div>

      <div className="lg:pl-72">
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <div className="h-6 w-px bg-gray-900/10 lg:hidden" aria-hidden="true" />
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6"></div>
        </div>

        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <button
              onClick={handleTrade}
              className="flex items-center justify-center w-full px-4 py-2 text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Trade
              <ArrowRightIcon className="w-5 h-5 ml-2" aria-hidden="true" />
            </button>

            {loading ? (
              <div className="mt-4 text-center text-indigo-600">
                <span>Trading...</span>
              </div>
            ) : (
              tradeDetails && (
                <div className="mt-4">
                  <h2 className="text-lg font-medium">Trade Details:</h2>
                  <pre className="bg-gray-100 p-4 rounded-md">{JSON.stringify(tradeDetails, null, 2)}</pre>
                </div>
              )
            )}
          </div>
        </main>
      </div>
    </>
  );
}
