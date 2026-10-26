/**
 * FriendAvatars.jsx — small overlapping avatar stack for mates' picks.
 */

export default function FriendAvatars({ friends, size = 18, max = 3 }) {
  const shown = friends.slice(0, max);
  return (
    <span className="inline-flex items-center shrink-0" aria-hidden="true">
      {shown.map((f, i) => (
        <span
          key={f.id}
          className="rounded-full flex items-center justify-center font-black"
          style={{
            width: size, height: size,
            fontSize: size * 0.42,
            marginLeft: i ? -size * 0.3 : 0,
            background: f.colour,
            color: '#05080F',
            border: '1.5px solid rgb(12,17,30)',
          }}
        >
          {f.initials[0]}
        </span>
      ))}
    </span>
  );
}
