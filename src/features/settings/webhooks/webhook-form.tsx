import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/utils/show-submitted-data'
import { Button } from '@/components/ui/button'

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'


const formSchema = z.object({
  url: z.string({
    required_error: 'Please input your URL',
  }),
})

type FormValues = z.infer<typeof formSchema>

// This can come from your database or API.
const defaultValues: Partial<FormValues> = {
  url: '',
}

export function WebhookForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  function onSubmit(data: FormValues) {
    showSubmittedData(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='url'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Submit</FormLabel>
              <FormControl>
                <Input placeholder='URL...' {...field} />
              </FormControl>
              <FormDescription>
                Enter URL to notify when task is submitted
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        
        <Button type='submit'>Save</Button>
      </form>
    </Form>
  )
}
