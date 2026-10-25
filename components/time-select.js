'use client'

const TIMES=Array.from({length:288},(_,index)=>`${String(Math.floor(index/12)).padStart(2,'0')}:${String((index%12)*5).padStart(2,'0')}`)
export function TimeSelect({value,onChange,...props}) {
  // Native mobile picker, five-minute choices; retain older minute-exact values.
  const choices=[...new Set([...TIMES,'23:59',...(value?[value]:[])])].sort()
  return <select {...props} value={value} onChange={onChange}>{choices.map(time=><option key={time} value={time}>{time}</option>)}</select>
}
