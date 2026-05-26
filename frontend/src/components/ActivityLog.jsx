import React, { useEffect, useRef } from 'react';

export default function ActivityLog({ logs }) {
  const logEndRef = useRef(null);

  // Auto-scroll to the bottom of logs on new entry
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="panel" style={{ height: '100%' }}>
      <div className="panel-header">
        <span>Log Aktivitas</span>
        <span style={{ fontSize: '20px' }}>💬</span>
      </div>
      
      <div className="activity-log">
        {logs.map((log) => (
          <div key={log.id} className={`log-item ${log.type}`}>
            {log.text}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
