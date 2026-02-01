/**
 * Real-time Call Watcher UI
 * Built with Ink (React for CLI)
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text, Newline } from 'ink';
import Spinner from 'ink-spinner';
import { getClient } from '../lib/vapi-client.js';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface CallState {
  id: string | null;
  status: 'waiting' | 'ringing' | 'in-progress' | 'ended';
  customerNumber: string | null;
  assistantName: string | null;
  messages: Message[];
  duration: number;
  score: number | null;
  meetingEarned: boolean | null;
}

const JOEY_COLOR = '#00D4AA';
const CALLER_COLOR = '#FFB800';
const DIM_COLOR = '#666666';

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function StatusBadge({ status }: { status: CallState['status'] }) {
  const colors: Record<CallState['status'], string> = {
    waiting: '#666666',
    ringing: '#FFB800',
    'in-progress': '#00D4AA',
    ended: '#FF6B6B',
  };
  
  const labels: Record<CallState['status'], string> = {
    waiting: 'WAITING',
    ringing: 'RINGING',
    'in-progress': 'LIVE',
    ended: 'ENDED',
  };

  return (
    <Text color={colors[status]} bold>
      {status === 'in-progress' && '● '}
      {labels[status]}
    </Text>
  );
}

function Header({ call }: { call: CallState }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text bold color="#00D4AA">🎤 VAPI CALL WATCHER</Text>
        <Text color={DIM_COLOR}> │ </Text>
        <StatusBadge status={call.status} />
        {call.status === 'in-progress' && (
          <>
            <Text color={DIM_COLOR}> │ </Text>
            <Text color="#888">{formatDuration(call.duration)}</Text>
          </>
        )}
      </Box>
      <Text color={DIM_COLOR}>{'─'.repeat(60)}</Text>
      {call.customerNumber && (
        <Box marginTop={0}>
          <Text color={DIM_COLOR}>Caller: </Text>
          <Text color={CALLER_COLOR}>{call.customerNumber}</Text>
          {call.assistantName && (
            <>
              <Text color={DIM_COLOR}> → </Text>
              <Text color={JOEY_COLOR}>{call.assistantName}</Text>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

function Transcript({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    return (
      <Box marginY={1}>
        <Text color={DIM_COLOR} italic>Waiting for conversation...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" marginY={1}>
      {messages.slice(-10).map((msg, i) => (
        <Box key={i} marginBottom={0}>
          <Text color={msg.role === 'assistant' ? JOEY_COLOR : CALLER_COLOR} bold>
            {msg.role === 'assistant' ? '🤖 Joey: ' : '👤 Caller: '}
          </Text>
          <Text wrap="wrap">{msg.content}</Text>
        </Box>
      ))}
    </Box>
  );
}

function WaitingScreen() {
  return (
    <Box flexDirection="column" alignItems="center" marginY={2}>
      <Box>
        <Text color={JOEY_COLOR}>
          <Spinner type="dots" />
        </Text>
        <Text color="#888"> Waiting for incoming call...</Text>
      </Box>
      <Newline />
      <Text color={DIM_COLOR}>Call one of these numbers to start:</Text>
      <Text color={JOEY_COLOR} bold>+1 (659) 216-7227</Text>
      <Text color={DIM_COLOR}> - Joey Optimized (Medium)</Text>
      <Text color={CALLER_COLOR} bold>+1 (617) 370-8226</Text>
      <Text color={DIM_COLOR}> - Joey VP Growth (Hard)</Text>
    </Box>
  );
}

function ScoreCard({ score, meetingEarned }: { score: number; meetingEarned: boolean }) {
  const scoreColor = score >= 8.5 ? '#00D4AA' : score >= 7 ? '#FFB800' : '#FF6B6B';
  
  return (
    <Box flexDirection="column" borderStyle="round" borderColor={scoreColor} paddingX={2} paddingY={1} marginY={1}>
      <Box justifyContent="center">
        <Text bold color={scoreColor}>
          FINAL SCORE: {score.toFixed(1)}/10
        </Text>
      </Box>
      <Box justifyContent="center">
        <Text color={meetingEarned ? '#00D4AA' : '#FF6B6B'} bold>
          {meetingEarned ? '✅ MEETING EARNED!' : '❌ No meeting this time'}
        </Text>
      </Box>
    </Box>
  );
}

function CallWatcher() {
  const [call, setCall] = useState<CallState>({
    id: null,
    status: 'waiting',
    customerNumber: null,
    assistantName: null,
    messages: [],
    duration: 0,
    score: null,
    meetingEarned: null,
  });

  const [error, setError] = useState<string | null>(null);

  // Poll for active calls
  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>;
    let durationInterval: ReturnType<typeof setInterval>;

    const pollCalls = async () => {
      try {
        const vapi = getClient();
        const calls = await vapi.calls.list({ limit: 1 });
        
        if (calls.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const latestCall = calls[0] as any;
          
          if (latestCall.status === 'in-progress' || latestCall.status === 'ringing') {
            setCall(prev => ({
              ...prev,
              id: latestCall.id,
              status: latestCall.status,
              customerNumber: latestCall.customer?.number || 'Unknown',
              assistantName: latestCall.assistantId ? 'Joey' : null,
            }));
          } else if (latestCall.status === 'ended' && latestCall.id === call.id) {
            // Call just ended
            setCall(prev => ({
              ...prev,
              status: 'ended',
              score: latestCall.analysis?.successEvaluation || null,
              meetingEarned: (latestCall.analysis?.successEvaluation || 0) >= 8.5,
            }));
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    pollInterval = setInterval(pollCalls, 2000);
    
    // Duration timer
    durationInterval = setInterval(() => {
      if (call.status === 'in-progress') {
        setCall(prev => ({ ...prev, duration: prev.duration + 1 }));
      }
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(durationInterval);
    };
  }, [call.id, call.status]);

  if (error) {
    return (
      <Box flexDirection="column">
        <Text color="#FF6B6B">Error: {error}</Text>
        <Text color={DIM_COLOR}>Make sure VAPI_API_KEY is set</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Header call={call} />
      
      {call.status === 'waiting' && <WaitingScreen />}
      
      {(call.status === 'in-progress' || call.status === 'ringing') && (
        <Transcript messages={call.messages} />
      )}
      
      {call.status === 'ended' && call.score !== null && (
        <ScoreCard score={call.score} meetingEarned={call.meetingEarned || false} />
      )}
      
      <Box marginTop={1}>
        <Text color={DIM_COLOR}>Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
}

export function startWatcher() {
  render(<CallWatcher />);
}
