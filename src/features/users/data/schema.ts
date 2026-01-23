import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('pending'),
  z.literal('inactive'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('owner'),
  z.literal('admin'),
  z.literal('member'),
])

const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  status: userStatusSchema,
  role: userRoleSchema,
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
