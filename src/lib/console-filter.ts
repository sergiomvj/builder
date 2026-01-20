// Development console filter to reduce noise
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Filter out common development warnings that are not critical
  const filteredMessages = [
    'Download the React DevTools',
    'Multiple GoTrueClient instances',
    'Extra attributes from the server: bis_skin_checked',
    'Warning: Extra attributes',
    'bis_skin_checked',
    'Text content does not match server-rendered HTML',
    'There was an error while hydrating',
    'Warning: Text content did not match'
  ];
  
  console.error = (...args) => {
    const message = args.join(' ');
    const shouldFilter = filteredMessages.some(filter => 
      message.includes(filter)
    );
    
    if (!shouldFilter) {
      originalConsoleError.apply(console, args);
    }
  };
  
  console.warn = (...args) => {
    const message = args.join(' ');
    const shouldFilter = filteredMessages.some(filter => 
      message.includes(filter)
    );
    
    if (!shouldFilter) {
      originalConsoleWarn.apply(console, args);
    }
  };
}