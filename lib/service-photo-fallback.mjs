// A deliberately neutral, generated appointment workspace. It does not stand
// in for a pictured procedure, an actual business interior or anyone's work.
export const NEUTRAL_SERVICE_PHOTO_SRC = '/service-photos/appointment-workspace-v1.webp'

// Exact bytes of appointment-workspace-inline-v1.webp, a 96px derivative of
// the same neutral image. This terminal fallback makes no further requests.
export const INLINE_NEUTRAL_SERVICE_PHOTO_SRC = 'data:image/webp;base64,UklGRpIDAABXRUJQVlA4IIYDAABwEwCdASpgAGAAPslWpU6npCMiJlJOmPAZCWMAyjSXTmj3CcPt6oDwrvRAHTa/i+pvWpsVZ+51AEqUJWN18iGqw9k8q7wGp+bA3am69TpgkDkjH6sKyR0Vn/Wmt1klgKmuVTZ8ED3IBJq8o08yjKtlRMHD2aFpOenBHg1sTc4dzPwnS/pE46xQMP4CxyCpnpSHRzQLEagkmYp9LRDcW1lH231EAAD+5kxSkCb5diP/b6D1XIEOidYdvjSqv5UOZw8CR7PGm3EiIG+iBeouPkkWb5zn0m5c+xABF99wscDxYEHngcFRuo5DvTB78DfKF87r8G5YUPUQ+cBT9sLNx2K01Or3lb69UhimGO4cZP1yn7u3vavi+ggbIjJ2DxnvbMGA8m+VLLC9ydY/A0obrFkIrtiOpJZsgEf18Hwm7iwUqTe6H0v38VIq/qNRgen7MY8bQM7/zLZV9IIqi4e0yh43HlfsSw45+KBPIoRmpfB09vQZ/DVJ8yU0eGPdN+Xr5Cz3PI/KS8r/Wp90KNPzuO+9/fMRdQaniT8ErB1rtwhMwRMoEFtV0PwnmMhzpLJNB5nAOhWJCaKUnKErvo8l+mdB1MsrBnJNMrq6awldk4Rw56uYReyZTQLaKziXrnIqI8H60qDQR5DDWspvVjAokNjjWwWNGU7+XILR5+FA49Sbed4ZwNfcp1KYZsvxc0KRMDN5l+2CrKSn5cnKUqt7CzuYLusAs3qOfKlokSgsmbVFd+NQSTxqzhoEK7219gd04Gfpjv47O8aN7MT0nZYNs50xfKmrNjpCE9p/wwbBbNDFhGvwHGDhLl7NKnWE5AX4d3IZwQulKCuDYJ1FSfolwrGOx/uuBDPMBsqzfX7KGkotH7xkN6idEWQv6T+jblJ2uD2fdkAAQt0hiKlwoB/KybUq7b6V+AWPCB1kv6193Tp8Vmj+OOsfHnYlTTX6KgtuEyLrkzNTzZK7KoL/3pcEOdFe7rwlFnEenjzYhSH9p40/Uv2yDmdSo+FRsTzR7XAzfkH5Yx4AplfgH3RWs668b+SyxOPQ/JNRlanxj/AVL6Hk5/fmKOVL2b2PBo0rNG7Nm8quj3eR7dXbJAMC90nPUTLbbv3yzYwklEJe8mNSi48BiLdvg5kuPxiL/Oge1Tnbp+oDL0K2tGs0TRYvj/fbgmMqv1PBO7nnUy7SivLmdtrC+xPvjuAAAA=='

export function neutralServiceThumbnail({ locale = 'bg', unavailableSources = [] } = {}) {
  const unavailable = new Set(Array.isArray(unavailableSources) ? unavailableSources : [])
  return { type: 'photo', source: 'illustrative', photoMatch: 'neutral', srcSet: null,
    src: unavailable.has(NEUTRAL_SERVICE_PHOTO_SRC) ? INLINE_NEUTRAL_SERVICE_PHOTO_SRC : NEUTRAL_SERVICE_PHOTO_SRC,
    alt: locale === 'en' ? "Neutral appointment photo, not a depiction of this service or the business's work" :
      'Неутрална снимка за резервация, не изобразява услугата или работа на бизнеса' }
}
