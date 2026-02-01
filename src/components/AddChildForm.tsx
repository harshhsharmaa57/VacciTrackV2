import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Baby, Mail, Phone, Lock, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { userRepository, childRepository, User, Child } from '@/lib/dataStore';
import { useLanguage } from '@/context/LanguageContext';
import { toast } from 'sonner';

// Validation schema
const addChildSchema = z.object({
  // Parent details
  parentName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  parentEmail: z.string().email('Invalid email address'),
  parentPhone: z.string().min(10, 'Phone must be at least 10 digits').max(15),
  parentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  // Child details
  childName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  childDob: z.string().refine((date) => {
    const dob = new Date(date);
    const now = new Date();
    return dob <= now;
  }, 'Date of birth cannot be in the future'),
  childGender: z.enum(['male', 'female']),
});

type AddChildFormData = z.infer<typeof addChildSchema>;

interface RegistrationResult {
  parent: User;
  child: Child;
  credentials: {
    email: string;
    password: string;
  };
}

interface AddChildFormProps {
  onSuccess?: (result: RegistrationResult) => void;
}

const AddChildForm: React.FC<AddChildFormProps> = ({ onSuccess }) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddChildFormData>({
    resolver: zodResolver(addChildSchema),
    defaultValues: {
      childGender: 'male',
    },
  });

  const generatePassword = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue('parentPassword', password);
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const onSubmit = async (data: AddChildFormData) => {
    setIsSubmitting(true);

    try {
      // Check if email already exists
      const existingUser = userRepository.findByEmail(data.parentEmail);
      if (existingUser) {
        toast.error('Registration Failed', {
          description: 'A user with this email already exists.',
        });
        setIsSubmitting(false);
        return;
      }

      // Create parent user
      const newParent = userRepository.create({
        email: data.parentEmail,
        password: data.parentPassword,
        name: data.parentName,
        role: 'parent',
        phone: data.parentPhone,
      });

      // Create child with vaccination schedule
      const newChild = childRepository.create({
        parentId: newParent.id,
        name: data.childName,
        dateOfBirth: new Date(data.childDob),
        gender: data.childGender,
      });

      const result: RegistrationResult = {
        parent: newParent,
        child: newChild,
        credentials: {
          email: data.parentEmail,
          password: data.parentPassword,
        },
      };

      setRegistrationResult(result);
      onSuccess?.(result);

      toast.success('Registration Successful!', {
        description: `${data.childName} has been registered with a complete vaccination schedule.`,
      });
    } catch (error) {
      toast.error('Registration Failed', {
        description: 'An error occurred while registering. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRegistrationResult(null);
    reset();
  };

  const handleNewRegistration = () => {
    setRegistrationResult(null);
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          {t('registerNewChild')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-primary" />
            {registrationResult ? 'Registration Complete' : t('registerNewChild')}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {registrationResult ? (
            // Success View - Show Credentials
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 py-4"
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Child Registered Successfully!
                </h3>
                <p className="text-muted-foreground">
                  A vaccination schedule has been auto-generated for {registrationResult.child.name}.
                </p>
              </div>

              {/* Child Info Card */}
              <div className="card-medical p-4">
                <h4 className="font-semibold text-foreground mb-3">Child Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{registrationResult.child.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">ABHA ID</p>
                    <p className="font-mono text-xs">{registrationResult.child.abhaId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Vaccines</p>
                    <p className="font-medium">{registrationResult.child.schedule.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{registrationResult.child.gender}</p>
                  </div>
                </div>
              </div>

              {/* Parent Credentials Card */}
              <div className="card-medical p-4 border-2 border-primary/20 bg-primary/5">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Parent Login Credentials
                </h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Please share these credentials with the parent. They can use these to access their child's dashboard.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-mono text-sm">{registrationResult.credentials.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(registrationResult.credentials.email, 'email')}
                    >
                      {copiedField === 'email' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Password</p>
                      <p className="font-mono text-sm">{registrationResult.credentials.password}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(registrationResult.credentials.password, 'password')}
                    >
                      {copiedField === 'password' ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleNewRegistration} className="flex-1">
                  Register Another Child
                </Button>
                <Button onClick={handleClose} className="flex-1">
                  Done
                </Button>
              </div>
            </motion.div>
          ) : (
            // Registration Form
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6 py-4"
            >
              {/* Parent Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-secondary" />
                  Parent Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="parentName">{t('parentName')} *</Label>
                    <Input
                      id="parentName"
                      {...register('parentName')}
                      placeholder="Enter parent's full name"
                    />
                    {errors.parentName && (
                      <p className="text-xs text-destructive">{errors.parentName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentEmail">{t('email')} *</Label>
                    <Input
                      id="parentEmail"
                      type="email"
                      {...register('parentEmail')}
                      placeholder="parent@example.com"
                    />
                    {errors.parentEmail && (
                      <p className="text-xs text-destructive">{errors.parentEmail.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPhone">{t('phone')} *</Label>
                    <Input
                      id="parentPhone"
                      {...register('parentPhone')}
                      placeholder="+91 98765 43210"
                    />
                    {errors.parentPhone && (
                      <p className="text-xs text-destructive">{errors.parentPhone.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="parentPassword">{t('password')} *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="parentPassword"
                        type="text"
                        {...register('parentPassword')}
                        placeholder="Create a password"
                      />
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        Generate
                      </Button>
                    </div>
                    {errors.parentPassword && (
                      <p className="text-xs text-destructive">{errors.parentPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Child Section */}
              <div>
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Baby className="w-4 h-4 text-primary" />
                  Child Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="childName">{t('childName')} *</Label>
                    <Input
                      id="childName"
                      {...register('childName')}
                      placeholder="Enter child's full name"
                    />
                    {errors.childName && (
                      <p className="text-xs text-destructive">{errors.childName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="childDob">{t('dateOfBirth')} *</Label>
                    <Input
                      id="childDob"
                      type="date"
                      {...register('childDob')}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.childDob && (
                      <p className="text-xs text-destructive">{errors.childDob.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>{t('gender')} *</Label>
                    <Select
                      defaultValue="male"
                      onValueChange={(value: 'male' | 'female') => setValue('childGender', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">{t('male')}</SelectItem>
                        <SelectItem value="female">{t('female')}</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.childGender && (
                      <p className="text-xs text-destructive">{errors.childGender.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Upon registration, the system will 
                  automatically generate a complete vaccination schedule based on the NIS 2025 guidelines 
                  and issue a unique ABHA ID for the child.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Registering...' : 'Register Child'}
                </Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AddChildForm;
