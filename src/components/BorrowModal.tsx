import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarIcon, UserIcon, MailIcon, PhoneIcon, BuildingIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const borrowFormSchema = z.object({
  requesterName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  affiliation: z.enum(["student", "staff", "public", "other"], {
    required_error: "Please select your affiliation",
  }),
  membershipId: z.string().optional(),
  idNumber: z.string().optional(),
  pickupLocation: z.string().min(1, "Please select a pickup location"),
  desiredDurationDays: z.number().min(1).max(90, "Maximum loan period is 90 days"),
  purpose: z.string().optional(),
  agreementAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the loan terms and conditions",
  }),
});

type BorrowFormData = z.infer<typeof borrowFormSchema>;

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: {
    id: string;
    title: string;
    authors: string[];
    availableCount: number;
  } | null;
  onSubmit: (data: BorrowFormData & { bookId: string }) => void;
}

const DURATION_PRESETS = [
  { value: 7, label: "1 week" },
  { value: 14, label: "2 weeks" },
  { value: 21, label: "3 weeks" },
  { value: 28, label: "4 weeks" },
];

const PICKUP_LOCATIONS = [
  "Main Library - Front Desk",
  "Science Library",
  "Engineering Library",
  "Arts & Humanities Library",
];

export function BorrowModal({ isOpen, onClose, book, onSubmit }: BorrowModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BorrowFormData>({
    resolver: zodResolver(borrowFormSchema),
    defaultValues: {
      requesterName: "",
      email: "",
      phone: "",
      affiliation: undefined,
      membershipId: "",
      idNumber: "",
      pickupLocation: "",
      desiredDurationDays: 14,
      purpose: "",
      agreementAccepted: false,
    },
  });

  const handleSubmit = async (data: BorrowFormData) => {
    if (!book) return;

    setIsSubmitting(true);
    try {
      await onSubmit({ ...data, bookId: book.id });
      toast({
        title: "Request Submitted",
        description: "Your borrow request has been submitted successfully. You'll receive an email confirmation shortly.",
      });
      onClose();
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit borrow request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    form.reset();
  };

  if (!book) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-card/95 backdrop-blur-xl border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Borrow Request
          </DialogTitle>
          <DialogDescription>
            <div className="mt-2 p-4 bg-card/50 rounded-xl border border-border/50">
              <h4 className="font-semibold text-card-foreground">{book.title}</h4>
              <p className="text-sm text-muted-foreground">by {book.authors.join(", ")}</p>
              <p className="text-sm text-success font-medium mt-1">
                {book.availableCount} copies available
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="requesterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+1-555-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="affiliation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Affiliation *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your affiliation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="membershipId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Membership ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormDescription>Library membership number if available</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Student/Staff ID" {...field} />
                      </FormControl>
                      <FormDescription>Student or employee ID</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Loan Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Loan Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickupLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Location *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select pickup location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PICKUP_LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>
                              {location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="desiredDurationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Borrow Duration *</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          {DURATION_PRESETS.map((preset) => (
                            <Button
                              key={preset.value}
                              type="button"
                              variant={field.value === preset.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => field.onChange(preset.value)}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="90"
                            placeholder="Custom days"
                            value={field.value}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                      </div>
                      <FormDescription>Maximum 90 days</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Research, coursework, personal study, etc."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Let us know how you plan to use this book
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>

            {/* Agreement */}
            <FormField
              control={form.control}
              name="agreementAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the loan terms and conditions *
                    </FormLabel>
                    <FormDescription>
                      I understand that I am responsible for returning the book(s) in good condition by the due date. 
                      Late returns may incur fines. I agree to pay for any lost or damaged items.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !book.availableCount}
                className="bg-gradient-primary shadow-neumorphic"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}