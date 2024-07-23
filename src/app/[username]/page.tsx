import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import { Metadata } from 'next/types'
import { PiXLogo } from 'react-icons/pi'

import { getUser, getUsers } from '@/actions/actions'
import WordwareLogo from '@/components/logo'
import NewUsernameForm from '@/components/new-username-form'
import { Button } from '@/components/ui/button'

// import { getURL } from '@/lib/config'

import ResultComponent from './result-component'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const Page = async ({ params }: { params: { username: string } }) => {
  const data = await getUser({ username: params.username })

  if (!data) {
    return redirect(`/?u=${params.username}`)
  }

  const extractDescription = ({ fullProfile }: { fullProfile: unknown }) => {
    if (typeof fullProfile !== 'object' || fullProfile === null) return ''

    const description = (fullProfile as any).description || ''
    const entities = (fullProfile as any).entities?.description

    if (!entities?.urls) return description

    return entities.urls.reduce((newDescription: string, url: any) => {
      return newDescription.replace(url.url, url.display_url)
    }, description)
  }

  const processedDescription = extractDescription({ fullProfile: data.fullProfile })

  return (
    <div className="flex-center relative min-h-screen w-full flex-col gap-12 bg-[#F9FAFB] px-4 py-28 sm:px-12 md:px-28 md:pt-24">
      <div className="flex-center fixed top-0 z-50 w-full border-b bg-white/80 py-2 shadow-[5px_5px_30px_rgba(190,190,190,0.15),-5px_-5px_30px_rgba(255,255,255,0.15)] backdrop-blur-sm">
        <div className="flex w-full flex-col items-center justify-between gap-4 px-2 md:flex-row md:px-12">
          <div className="flex items-center gap-2">
            This agent has been built with
            <a
              href="https://wordware.ai/"
              target="_blank">
              <WordwareLogo
                color="black"
                width={134}
              />
            </a>
          </div>
          <div className="flex-center gap-2">
            <Button
              size={'sm'}
              variant={'default'}
              asChild>
              <a
                href={`https://app.wordware.ai/share/${process.env.WORDWARE_PROMPT_ID}/playground`}
                target="_blank"
                className="flex-center gap-2">
                <WordwareLogo
                  emblemOnly
                  color={'white'}
                  width={12}
                />
                Duplicate Project
              </a>
            </Button>
            <Button
              size={'sm'}
              variant={'outline'}
              asChild>
              <a
                href="https://x.com/wordware_ai"
                target="_blank"
                className="flex-center gap-2">
                <PiXLogo size={18} /> Follow us
              </a>
            </Button>
          </div>
        </div>
      </div>
      {/* <DotPattern className={cn('-z-50 [mask-image:radial-gradient(300px_circle_at_center,white,transparent)]')} /> */}
      <div className="flex-center flex-col gap-6">
        <div className="text-center text-xl font-light">
          Here&apos;s the <span className="font-medium">AI agent</span> analysis of your personality...
        </div>

        <div className="flex gap-4">
          <div className="flex-center grow">
            <img
              src={data.profilePicture || ''}
              alt="profile image"
              className="max-h-24 min-h-24 w-full min-w-24 max-w-24 rounded-full border border-gray-300"
              width={96}
              height={96}
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-xl font-bold">
              {data.name} <span className="text-base font-normal text-gray-500">@{data.username}</span>
            </div>
            <div className="text-gray-500">{data.location}</div>
            <div className="max-w-sm text-sm">{processedDescription}</div>
          </div>
        </div>
      </div>

      <ResultComponent user={data} />

      <div className="flex-center container mx-auto flex-col space-y-4 px-4">
        <div className="text-center text-2xl font-light">Try with your own profile</div>
        <div className="flex-center">
          <Suspense>
            <NewUsernameForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default Page

export async function generateStaticParams() {
  const users = await getUsers()
  return users.map((user) => ({
    username: user.username,
  }))
}

export async function generateMetadata({ params }: { params: { username?: string } }) {
  if (!params.username) return notFound()
  const user = await getUser({ username: params.username })

  if (user == null) notFound()
  const imageParams = new URLSearchParams()

  const name = user?.name || ''
  const username = user?.username || ''
  const picture = user?.profilePicture || ''
  const about = ((user.analysis as any)?.about?.replace('*', '') || '').trim()
  const emojis = ((user.analysis as any)?.emojis || '').trim()

  imageParams.set('name', name)
  imageParams.set('username', username)
  imageParams.set('picture', picture)
  imageParams.set('about', about)
  imageParams.set('emojis', emojis)

  const image = {
    alt: 'Banner',
    url: `/api/og?${imageParams.toString()}`,
    // url: `${getURL()}/api/og?${imageParams.toString()}`,
    width: 1200,
    height: 630,
  }

  return {
    title: name,
    description: `Check out ${name}'s Twitter Personality.`,
    openGraph: {
      url: `/${username}`,
      images: image,
    },
    twitter: {
      images: image,
    },
  } satisfies Metadata
}